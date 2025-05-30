const blogDB = new BlogDB();
let currentEditId = null;
let isLoggedIn = false;
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = '123456';
// 替换固定API地址为动态获取
const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (localStorage.getItem('isLoggedIn') === 'true') {
        isLoggedIn = true;
        const username = localStorage.getItem('username');
        await updateUIForLoggedInUser(username);
    } else {
        await updateUIForLoggedOutUser();
    }
    
    await loadCategories();
    setupEventListeners();
    setupWebSocket(); // 添加WebSocket初始化
});

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        
        // 更新文章列表
        const container = document.getElementById('posts-container');
        container.innerHTML = '';
        posts.forEach(post => {
            const card = createPostCard(post);
            container.appendChild(card);
        });

        // 更新侧边栏更新日志
        updateSidebar(posts);
    } catch (error) {
        console.error('加载文章失败:', error);
    }
}

function updateSidebar(posts) {
    // 按日期分组文章
    const groupedPosts = {};
    posts.forEach(post => {
        const date = new Date(post.created_at).toLocaleDateString('zh-CN');
        if (!groupedPosts[date]) {
            groupedPosts[date] = [];
        }
        groupedPosts[date].push(post);
    });

    // 更新侧边栏
    const updateLog = document.getElementById('update-log');
    updateLog.innerHTML = Object.entries(groupedPosts)
        .sort((a, b) => new Date(b[0]) - new Date(a[0])) // 按日期降序排序
        .map(([date, posts]) => `
            <li>
                <h3 class="update-date">${date}</h3>
                ${posts.map(post => `
                    <a href="/article.html?id=${post.id}" class="update-item">
                        ${post.title}
                    </a>
                `).join('')}
            </li>
        `).join('');
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        const select = document.getElementById('category-select');
        
        // 清除现有选项，保留"所有分类"
        select.innerHTML = '<option value="">所有分类</option>';
        
        // 添加唯一分类
        categories.forEach(category => {
            select.innerHTML += `<option value="${category}">${category}</option>`;
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.onclick = (e) => {
        // 如果点击的是按钮，则不进行跳转
        if (e.target.tagName === 'BUTTON') return;
        window.location.href = `/article.html?id=${post.id}`;
    };
    card.style.cursor = 'pointer';
    const buttonsHtml = isLoggedIn ? `
        <div class="button-group">
            <button onclick="editPost(${post.id})">编辑</button>
            <button onclick="deletePost(${post.id})">删除</button>
        </div>
    ` : '';
    
    card.innerHTML = `
        <img src="${post.image || 'placeholder.jpg'}" alt="${post.title}">
        <div class="post-content">
            <h3>${post.title}</h3>
            <p class="post-meta">
                <span class="category">${post.category}</span>
                <span class="date">${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
            </p>
            <p>${post.content.substring(0, 100)}...</p>
            ${buttonsHtml}
        </div>
    `;
    return card;
}

function setupEventListeners() {

    document.getElementById('new-post').addEventListener('click', () => {
        currentEditId = null;
        showModal();
    });

    document.getElementById('save-post').addEventListener('click', savePost);
    document.getElementById('cancel-edit').addEventListener('click', hideModal);

    // 添加图片预览功能
    document.getElementById('post-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('image-preview');
                preview.style.display = 'block';
                preview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
            }
            reader.readAsDataURL(file);
        }
    });

    // 添加搜索功能
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // 添加分类过滤功能
    const categorySelect = document.getElementById('category-select');
    categorySelect.addEventListener('change', async () => {
        const searchTerm = document.querySelector('.search-bar input').value.trim();
        const category = categorySelect.value;
        await handleSearch({ searchTerm, category });
    });

    // 添加登录相关事件监听
    document.getElementById('login-btn').addEventListener('click', showLoginModal);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('confirm-login').addEventListener('click', handleLogin);
    document.getElementById('cancel-login').addEventListener('click', hideLoginModal);

    // 添加菜单切换功能
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // 点击页面其他地方关闭菜单
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menu-toggle');
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// 添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 添加搜索处理函数
async function handleSearch(e) {
    try {
        const searchTerm = e.target?.value?.trim() || e.searchTerm || '';
        const category = document.getElementById('category-select').value;
        
        const queryParams = new URLSearchParams({
            q: searchTerm,
            category: category
        });
        
        const response = await fetch(`${API_URL}/posts/search?${queryParams}`);
        const posts = await response.json();
        
        const container = document.getElementById('posts-container');
        container.innerHTML = '';
        
        posts.forEach(post => {
            const card = createPostCard(post);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('搜索失败:', error);
    }
}

function showModal() {
    document.getElementById('edit-modal').style.display = 'block';
}

function hideModal() {
    document.getElementById('edit-modal').style.display = 'none';
    clearForm();
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function hideLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === TEST_USERNAME && password === TEST_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        hideLoginModal();
        await updateUIForLoggedInUser(username); // 改为异步函数调用
    } else {
        alert('用户名或密码错误');
    }
}

async function updateUIForLoggedInUser(username) {
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('username-display').textContent = `欢迎，${username}`;
    document.getElementById('new-post').style.display = 'flex';
    await loadPosts(); // 登录后重新加载文章列表以显示编辑按钮
}

function updateUIForLoggedOutUser() {
    document.getElementById('login-btn').style.display = 'flex';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('new-post').style.display = 'none';
    loadPosts(); // 登出后重新加载文章列表以隐藏编辑按钮
}

function handleLogout() {
    if (confirm('确定要注销吗？')) {
        isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        document.getElementById('login-btn').style.display = 'flex';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('new-post').style.display = 'none';
        loadPosts(); // 重新加载文章列表以隐藏编辑按钮
    }
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value;
    const imageFile = document.getElementById('post-image').files[0];

    if (!title || !category || !content) {
        alert('请填写所有必填字段');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('content', content);
    
    // 处理图片
    if (imageFile) {
        formData.append('image', imageFile);
    } else if (currentEditId) {
        // 如果是编辑模式且没有新图片，保留原图片路径
        const currentImage = document.querySelector('#image-preview img')?.src;
        if (currentImage) {
            formData.append('originalImage', currentImage);
        }
    }

    try {
        const url = currentEditId ? 
            `${API_URL}/posts/${currentEditId}` : 
            `${API_URL}/posts`;
        
        const method = currentEditId ? 'PUT' : 'POST';
        
        await fetch(url, {
            method: method,
            body: formData
        });

        await loadPosts();
        hideModal();
    } catch (error) {
        console.error('保存文章失败:', error);
        alert('保存失败，请重试');
    }
}

async function editPost(id) {
    if (!isLoggedIn) {
        alert('请先登录');
        showLoginModal();
        return;
    }
    try {
        currentEditId = id;
        const response = await fetch(`${API_URL}/posts/${id}`);
        const post = await response.json();
        
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-content').value = post.content;
        
        // 显示已有图片
        if (post.image) {
            const preview = document.getElementById('image-preview');
            preview.style.display = 'block';
            preview.innerHTML = `<img src="${post.image}" alt="当前图片">`;
        }
        
        showModal();
    } catch (error) {
        console.error('获取文章失败:', error);
        alert('获取文章失败，请重试');
    }
}

async function deletePost(id) {
    if (!isLoggedIn) {
        alert('请先登录');
        showLoginModal();
        return;
    }
    if (confirm('确定要删除这篇文章吗？')) {
        try {
            await fetch(`${API_URL}/posts/${id}`, {
                method: 'DELETE'
            });
            await loadPosts();
        } catch (error) {
            console.error('删除文章失败:', error);
            alert('删除失败，请重试');
        }
    }
}

function clearForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').innerHTML = '';
}

function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// 添加WebSocket连接
function setupWebSocket() {
    const ws = new WebSocket(`ws://${window.location.hostname}:3000`);
    
    ws.onmessage = async function(event) {
        if (event.data === 'update') {
            await loadPosts();
            await loadCategories();
        }
    };

    ws.onclose = function() {
        console.log('WebSocket连接已断开，尝试重新连接...');
        setTimeout(setupWebSocket, 3000);
    };
}
