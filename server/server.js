const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./database.sqlite');

// 确保uploads目录存在
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 中间件配置
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 更新静态文件中间件配置
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 初始化数据库
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT,
        content TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 修改删除图片的辅助函数为Promise
function deleteImage(imagePath) {
    return new Promise((resolve, reject) => {
        if (!imagePath) {
            resolve();
            return;
        }
        // 修正图片路径
        const fullPath = path.join(__dirname, '../public', imagePath);
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('删除图片失败:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// API路由
app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 添加获取所有分类的路由
app.get('/api/categories', (req, res) => {
    db.all('SELECT DISTINCT category FROM posts', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const categories = rows.map(row => row.category).filter(Boolean);
        res.json(categories);
    });
});

// 修改搜索路由以支持分类过滤
app.get('/api/posts/search', (req, res) => {
    const searchTerm = req.query.q || '';
    const category = req.query.category || '';
    
    let query = 'SELECT * FROM posts WHERE 1=1';
    const params = [];
    
    if (searchTerm) {
        query += ' AND (title LIKE ? OR content LIKE ? OR category LIKE ?)'; // 添加category搜索
        params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 添加获取单个文章的路由
app.get('/api/posts/:id', (req, res) => {
    db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Article not found' });
        res.json(row);
    });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket连接处理
wss.on('connection', (ws) => {
    console.log('新的客户端连接');
    ws.on('close', () => console.log('客户端断开连接'));
});

// 广播更新消息给所有客户端
function broadcastUpdate() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('update');
        }
    });
}

app.post('/api/posts', upload.single('image'), (req, res) => {
    const { title, category, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        'INSERT INTO posts (title, category, content, image) VALUES (?, ?, ?, ?)',
        [title, category, content, image],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            broadcastUpdate(); // 发送更新通知
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/posts/:id', upload.single('image'), (req, res) => {
    const { title, category, content, originalImage } = req.body;
    let image = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 如果没有上传新图片但有原图片，保留原图片
    if (!image && originalImage) {
        // 从完整URL中提取路径部分
        const urlObj = new URL(originalImage);
        image = urlObj.pathname;
    }
    
    // 先获取旧图片路径
    db.get('SELECT image FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // 只有在上传新图片时才删除旧图片
        if (req.file && row && row.image) {
            deleteImage(row.image);
        }
        
        // 更新文章信息
        db.run(
            'UPDATE posts SET title = ?, category = ?, content = ?, image = ? WHERE id = ?',
            [title, category, content, image, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                broadcastUpdate(); // 发送更新通知
                res.json({ success: true });
            }
        );
    });
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        // 先获取文章信息
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT image FROM posts WHERE id = ?', [req.params.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // 如果文章存在图片，先删除图片
        if (row && row.image) {
            await deleteImage(row.image);
        }

        // 最后删除文章记录
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        broadcastUpdate(); // 发送更新通知
        res.json({ success: true });
    } catch (error) {
        console.error('删除失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 修改通配符路由，添加对 article.html 的支持
app.get('*', (req, res) => {
    if (req.path.includes('article.html')) {
        res.sendFile(path.join(__dirname, '../article.html'));
    } else {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`WebSocket server running at ws://0.0.0.0:${port}`);
    console.log(`Local access via: http://localhost:${port}`);
    console.log(`Network access via: http://{your-ip-address}:${port}`);
});
