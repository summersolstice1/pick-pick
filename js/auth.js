class AuthManager {
    constructor() {
        this.storage = new StorageManager();
        this.api = new ApiClient();
        this.token = this.storage.getAuthToken();
        this.user = this.storage.getUser();
    }

    isLoggedIn() {
        return Boolean(this.token && this.user);
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    async bootstrap() {
        if (!this.token) {
            this.dispatchChange();
            return;
        }

        try {
            const response = await this.api.get('/api/auth/me');
            this.user = response.user;
            this.storage.saveUser(this.user);
            const gameData = await this.api.get('/api/game-data');
            this.applyServerGameData(gameData, false);
        } catch (error) {
            console.warn('恢复登录态失败:', error.message);
            this.logout(true);
            return;
        }

        this.dispatchChange();
    }

    async register(payload) {
        const response = await this.api.post('/api/auth/register', payload);
        await this.handleAuthSuccess(response, true);
        return response;
    }

    async login(payload) {
        const response = await this.api.post('/api/auth/login', payload);
        await this.handleAuthSuccess(response, false);
        return response;
    }

    async handleAuthSuccess(response, preferLocalData) {
        this.token = response.token;
        this.user = response.user;
        this.storage.saveAuthToken(this.token);
        this.storage.saveUser(this.user);

        const localPayload = this.storage.getCloudPayload();
        const serverPayload = response.gameData || {};
        const shouldUploadLocal =
            this.hasMeaningfulLocalData(localPayload) && this.isServerDataEmpty(serverPayload);

        if (preferLocalData || shouldUploadLocal) {
            await this.syncGameData(localPayload);
        } else {
            this.applyServerGameData(serverPayload, false);
        }

        this.dispatchChange();
    }

    logout(silent = false) {
        this.token = null;
        this.user = null;
        this.storage.clearAuth();
        if (!silent) {
            this.dispatchChange();
        }
    }

    async syncGameData(payload) {
        if (!this.token) {
            return null;
        }

        const response = await this.api.put('/api/game-data', payload);
        this.applyServerGameData(response, false);
        return response;
    }

    applyServerGameData(payload, dispatchEvent = true) {
        this.storage.applyCloudPayload(payload);
        if (dispatchEvent) {
            window.dispatchEvent(new CustomEvent('game-data:updated'));
        }
    }

    hasMeaningfulLocalData(payload) {
        const achievementsUnlocked = Object.values(payload.achievements || {}).some(Boolean);
        const hasCustomSettings = JSON.stringify(payload.settings || {}) !== JSON.stringify(this.storage.getDefaultSettings());
        return (payload.stats?.totalGames || 0) > 0 || achievementsUnlocked || hasCustomSettings;
    }

    isServerDataEmpty(payload) {
        return !payload?.stats || (payload.stats.totalGames || 0) === 0;
    }

    async updateProfile(displayName) {
        const response = await this.api.patch('/api/auth/profile', { displayName });
        this.user = response.user;
        this.storage.saveUser(this.user);
        this.dispatchChange();
        return response.user;
    }

    async changePassword(oldPassword, newPassword) {
        return this.api.post('/api/auth/change-password', { oldPassword, newPassword });
    }

    dispatchChange() {
        window.dispatchEvent(
            new CustomEvent('auth:changed', {
                detail: {
                    user: this.user
                }
            })
        );
    }
}
