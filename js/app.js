class App {
    constructor() {
        this.storage = new StorageManager();
        this.audio = new AudioManager();
        this.ui = new UIManager();
        this.stats = new StatsManager();
        this.engine = new GameEngine();

        window.app = this;
        window.ui = this.ui;
        window.gameEngine = this.engine;
        window.audioManager = this.audio;
        window.statsManager = this.stats;

        this.init();
    }

    async init() {
        this.initEventListeners();
        await window.auth.bootstrap();
        this.ui.loadSettings();
        this.stats.updateStats();
        this.ui.renderAchievements();
        this.showWelcome();
    }

    initEventListeners() {
        window.addEventListener('focus', () => this.audio.enable());
        window.addEventListener('blur', () => this.audio.disable());

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.engine.gameState === 'playing') {
                this.engine.gameState = 'paused';
            }

            if (event.key === ' ' && this.engine.gameState === 'menu') {
                document.getElementById('startGameBtn')?.click();
            }
        });

        window.addEventListener('auth:changed', (event) => {
            this.ui.updateAuthUI(event.detail.user);
            this.stats.updateStats();
            this.ui.renderAchievements();
        });

        window.addEventListener('game-data:updated', () => {
            this.ui.loadSettings();
            this.stats.updateStats();
            this.ui.renderAchievements();
        });
    }

    showWelcome() {
        const stats = this.storage.getStats();
        const user = window.auth.getUser();

        if (!stats.totalGames) {
            this.ui.showNotification(user ? `欢迎回来，${user.displayName || user.username}` : '欢迎来到 Summer，先打一局试试手感');
            return;
        }

        const message = user
            ? `${user.displayName || user.username}，你已经累计完成 ${stats.totalGames} 局训练`
            : `访客模式下你已经完成 ${stats.totalGames} 局训练`;
        this.ui.showNotification(message);
    }

    resetData() {
        if (!confirm('确定要清空本地训练数据吗？已登录账号不会自动删除云端存档。')) {
            return;
        }

        this.storage.saveStats(this.storage.getDefaultStats());
        this.storage.saveAchievements(this.storage.getDefaultAchievements());
        this.storage.saveSettings(this.storage.getDefaultSettings());
        this.storage.saveSensitivityConfig(this.storage.getDefaultSensitivityConfig());
        this.stats.updateStats();
        this.ui.loadSettings();
        this.ui.renderAchievements();
        this.ui.showNotification('本地数据已重置');
    }

    exportData() {
        const data = {
            ...this.storage.getCloudPayload(),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `summer-data-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (loadEvent) => {
                try {
                    const payload = JSON.parse(loadEvent.target.result);
                    this.storage.applyCloudPayload(payload);
                    this.ui.loadSettings();
                    this.stats.updateStats();
                    this.ui.renderAchievements();

                    if (window.auth.isLoggedIn()) {
                        await window.auth.syncGameData(this.storage.getCloudPayload());
                    }

                    this.ui.showNotification('数据导入成功');
                } catch (error) {
                    this.ui.showNotification(`导入失败：${error.message}`);
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
}

async function bootApplication() {
    window.auth = new AuthManager();

    try {
        await loadChartJs();
    } catch (error) {
        console.warn('Chart.js 加载失败，将降级为无图表模式。');
    }

    new App();
}

function loadChartJs() {
    if (window.Chart) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    bootApplication();
});
