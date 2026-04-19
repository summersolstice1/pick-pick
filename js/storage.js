class StorageManager {
    constructor() {
        this.prefix = 'Summer_';
    }

    getDefaultSettings() {
        return {
            hudEnabled: true,
            mouseTrailEnabled: 'global',
            particlesEnabled: true,
            soundEnabled: 'global',
            cursorType: 'default',
            cursorSize: 20,
            cursorColor: '#ff4d6d',
            cursorEnabled: 'global'
        };
    }

    getDefaultStats() {
        return {
            totalGames: 0,
            totalHits: 0,
            totalShots: 0,
            totalScore: 0,
            bestScore: 0,
            bestAccuracy: 0,
            bestReactionTime: null,
            games: []
        };
    }

    getDefaultAchievements() {
        return {
            beginner: false,
            sharpshooter: false,
            comboMaster: false,
            quickReaction: false,
            perfectionist: false,
            persistent: false,
            highScorer: false,
            comboNovice: false,
            comboExpert: false,
            precisionMaster: false,
            lightningReaction: false,
            gameEnthusiast: false,
            gameMaster: false,
            jackOfAllTrades: false
        };
    }

    getDefaultSensitivityConfig() {
        return {
            game: 'cs2',
            sensitivity: 2,
            dpi: 800,
            cm360: 26,
            webSensitivity: 1
        };
    }

    normalizeStats(stats = {}) {
        const base = this.getDefaultStats();
        const games = Array.isArray(stats.games) ? stats.games.slice(-100) : [];

        return {
            ...base,
            ...stats,
            totalGames: Number(stats.totalGames || 0),
            totalHits: Number(stats.totalHits || 0),
            totalShots: Number(stats.totalShots || 0),
            totalScore: Number(stats.totalScore || 0),
            bestScore: Number(stats.bestScore || 0),
            bestAccuracy: Number(stats.bestAccuracy || 0),
            bestReactionTime:
                stats.bestReactionTime === null || stats.bestReactionTime === undefined
                    ? null
                    : Number(stats.bestReactionTime),
            games: games.map((game) => ({
                mode: String(game.mode || 'flicking'),
                score: Number(game.score || 0),
                accuracy: Number(game.accuracy || 0),
                hits: Number(game.hits || 0),
                shots: Number(game.shots || 0),
                maxCombo: Number(game.maxCombo || 0),
                avgReactionTime: Number(game.avgReactionTime || 0),
                duration: Number(game.duration || 30),
                date: game.date || new Date().toISOString()
            }))
        };
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    saveSettings(settings) {
        return this.set('settings', {
            ...this.getDefaultSettings(),
            ...(settings || {})
        });
    }

    getSettings() {
        return {
            ...this.getDefaultSettings(),
            ...(this.get('settings', {}) || {})
        };
    }

    saveStats(stats) {
        return this.set('stats', this.normalizeStats(stats));
    }

    getStats() {
        return this.normalizeStats(this.get('stats', this.getDefaultStats()));
    }

    saveAchievements(achievements) {
        return this.set('achievements', {
            ...this.getDefaultAchievements(),
            ...(achievements || {})
        });
    }

    getAchievements() {
        return {
            ...this.getDefaultAchievements(),
            ...(this.get('achievements', {}) || {})
        };
    }

    saveSensitivityConfig(config) {
        return this.set('sensitivityConfig', {
            ...this.getDefaultSensitivityConfig(),
            ...(config || {})
        });
    }

    getSensitivityConfig() {
        return {
            ...this.getDefaultSensitivityConfig(),
            ...(this.get('sensitivityConfig', {}) || {})
        };
    }

    saveAuthToken(token) {
        return this.set('authToken', token || null);
    }

    getAuthToken() {
        return this.get('authToken', null);
    }

    saveUser(user) {
        return this.set('authUser', user || null);
    }

    getUser() {
        return this.get('authUser', null);
    }

    clearAuth() {
        this.remove('authToken');
        this.remove('authUser');
    }

    getCloudPayload() {
        return {
            stats: this.getStats(),
            achievements: this.getAchievements(),
            settings: this.getSettings(),
            sensitivityConfig: this.getSensitivityConfig()
        };
    }

    applyCloudPayload(payload = {}) {
        if (payload.stats) {
            this.saveStats(payload.stats);
        }

        if (payload.achievements) {
            this.saveAchievements(payload.achievements);
        }

        if (payload.settings) {
            this.saveSettings(payload.settings);
        }

        if (payload.sensitivityConfig) {
            this.saveSensitivityConfig(payload.sensitivityConfig);
        }
    }
}
