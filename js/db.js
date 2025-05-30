class BlogDB {
    constructor() {
        this.dbName = 'blogDB';
        this.dbVersion = 1;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('posts')) {
                    db.createObjectStore('posts', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async addPost(post) {
        const transaction = this.db.transaction(['posts'], 'readwrite');
        const store = transaction.objectStore('posts');
        return new Promise((resolve, reject) => {
            const request = store.add(post);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPosts() {
        const transaction = this.db.transaction(['posts'], 'readonly');
        const store = transaction.objectStore('posts');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updatePost(post) {
        const transaction = this.db.transaction(['posts'], 'readwrite');
        const store = transaction.objectStore('posts');
        return new Promise((resolve, reject) => {
            const request = store.put(post);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePost(id) {
        const transaction = this.db.transaction(['posts'], 'readwrite');
        const store = transaction.objectStore('posts');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
