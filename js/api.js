class ApiClient {
    async request(path, options = {}) {
        const headers = {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        };

        if (!headers.Authorization && window.auth && window.auth.getToken()) {
            headers.Authorization = `Bearer ${window.auth.getToken()}`;
        }

        const response = await fetch(path, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const payload = isJson ? await response.json() : null;

        if (!response.ok) {
            throw new Error(payload?.error || '请求失败');
        }

        return payload;
    }

    get(path) {
        return this.request(path);
    }

    post(path, body) {
        return this.request(path, { method: 'POST', body });
    }

    put(path, body) {
        return this.request(path, { method: 'PUT', body });
    }

    patch(path, body) {
        return this.request(path, { method: 'PATCH', body });
    }
}
