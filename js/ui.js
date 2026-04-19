class UIManager {
    constructor() {
        this.storage = new StorageManager();
        this.settings = this.storage.getSettings();
        this.achievementMeta = [
            { key: 'beginner', title: '初学者', description: '完成你的第一局训练', icon: '01' },
            { key: 'sharpshooter', title: '精准射手', description: '单局命中率达到 80%', icon: '02' },
            { key: 'comboMaster', title: '连击大师', description: '单局达到 100 连击', icon: '03' },
            { key: 'quickReaction', title: '快速反应', description: '平均反应时间低于 100ms', icon: '04' },
            { key: 'perfectionist', title: '完美主义', description: '整局训练零空枪', icon: '05' },
            { key: 'persistent', title: '坚持不懈', description: '累计完成 100 局训练', icon: '06' },
            { key: 'highScorer', title: '高分达人', description: '单局得分达到 1000', icon: '07' },
            { key: 'comboNovice', title: '连击新手', description: '单局达到 10 连击', icon: '08' },
            { key: 'comboExpert', title: '连击专家', description: '单局达到 50 连击', icon: '09' },
            { key: 'precisionMaster', title: '精准大师', description: '单局命中率达到 95%', icon: '10' },
            { key: 'lightningReaction', title: '闪电反应', description: '平均反应时间低于 50ms', icon: '11' },
            { key: 'gameEnthusiast', title: '训练爱好者', description: '累计完成 10 局训练', icon: '12' },
            { key: 'gameMaster', title: '训练大师', description: '累计完成 50 局训练', icon: '13' },
            { key: 'jackOfAllTrades', title: '全能选手', description: '体验全部五种训练模式', icon: '14' }
        ];
        this.init();
    }

    init() {
        this.initNavigation();
        this.initAuthModal();
        this.initSettings();
        this.initGameControls();
        this.initProfileForms();
        this.initDataActions();
        this.initCursor();
        this.loadSettings();
        this.renderAchievements();
        this.updateAuthUI(window.auth?.getUser?.() || null);
    }

    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const view = event.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        document.querySelectorAll('[data-mode]').forEach((button) => {
            button.addEventListener('click', (event) => {
                const mode = event.currentTarget.dataset.mode;
                const modeButtons = document.querySelectorAll('.mode-btn');
                modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
            });
        });
    }

    initAuthModal() {
        const modal = document.getElementById('authModal');
        const openButtons = document.querySelectorAll('[data-action="open-auth"]');
        const closeButton = document.getElementById('closeAuthModal');
        const tabButtons = document.querySelectorAll('.auth-tab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const guestButton = document.getElementById('continueGuestBtn');
        const logoutButton = document.getElementById('logoutBtn');
        const openSettingsButton = document.getElementById('openSettingsBtn');

        openButtons.forEach((button) => {
            button.addEventListener('click', () => this.toggleAuthModal(true));
        });

        closeButton?.addEventListener('click', () => this.toggleAuthModal(false));
        modal?.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.toggleAuthModal(false);
            }
        });

        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                tabButtons.forEach((item) => item.classList.toggle('active', item === button));
                document.getElementById('loginPanel').classList.toggle('active', button.dataset.tab === 'login');
                document.getElementById('registerPanel').classList.toggle('active', button.dataset.tab === 'register');
            });
        });

        loginForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            try {
                await window.auth.login({
                    username: formData.get('username'),
                    password: formData.get('password')
                });
                this.toggleAuthModal(false);
                this.showNotification('登录成功，训练数据已就位');
            } catch (error) {
                this.showNotification(error.message);
            }
        });

        registerForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(registerForm);
            try {
                await window.auth.register({
                    username: formData.get('username'),
                    displayName: formData.get('displayName'),
                    password: formData.get('password')
                });
                this.toggleAuthModal(false);
                this.showNotification('账号创建成功，本地进度已同步到云端');
            } catch (error) {
                this.showNotification(error.message);
            }
        });

        guestButton?.addEventListener('click', () => {
            this.toggleAuthModal(false);
            this.switchView('training');
        });

        logoutButton?.addEventListener('click', () => {
            window.auth.logout();
            this.showNotification('已退出登录，当前改为访客模式');
        });

        openSettingsButton?.addEventListener('click', () => this.switchView('settings'));
    }

    initSettings() {
        const cursorSizeSlider = document.getElementById('cursorSize');
        const cursorSizeValue = document.getElementById('cursorSizeValue');

        cursorSizeSlider?.addEventListener('input', (event) => {
            const size = event.target.value;
            cursorSizeValue.textContent = `${size}px`;
            this.updateCursor();
        });

        document.getElementById('cursorType')?.addEventListener('change', () => this.updateCursor());
        document.getElementById('cursorColor')?.addEventListener('input', () => this.updateCursor());
        document.getElementById('cursorEnabled')?.addEventListener('change', () => this.updateCursor());

        document.getElementById('gameSelect')?.addEventListener('change', (event) => {
            this.updateSensitivityRange(event.target.value);
            this.updateSensitivityDisplay();
        });

        const sensitivitySlider = document.getElementById('sensitivity');
        const sensitivityInput = document.getElementById('sensitivityInput');
        sensitivitySlider?.addEventListener('input', (event) => {
            sensitivityInput.value = event.target.value;
            this.updateSensitivityDisplay();
        });
        sensitivityInput?.addEventListener('input', (event) => {
            sensitivitySlider.value = event.target.value;
            this.updateSensitivityDisplay();
        });

        document.getElementById('dpi')?.addEventListener('input', () => this.updateSensitivityDisplay());

        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });
    }

    initGameControls() {
        document.getElementById('startGameBtn')?.addEventListener('click', () => {
            const mode = document.querySelector('.mode-btn.active')?.dataset.mode || 'flicking';
            const difficulty = document.getElementById('difficulty').value;
            const targetSize = document.getElementById('targetSize').value;
            const duration = parseInt(document.getElementById('gameDuration').value, 10);

            if (window.gameEngine) {
                window.gameEngine.startGame(mode, difficulty, targetSize, duration);
                document.getElementById('gameMenu').style.display = 'none';
            }
        });

        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            document.getElementById('gameResult').classList.add('hidden');
            document.getElementById('gameMenu').style.display = 'flex';
        });

        document.getElementById('backToMenuBtn')?.addEventListener('click', () => {
            document.getElementById('gameResult').classList.add('hidden');
            document.getElementById('gameMenu').style.display = 'flex';
            this.switchView('home');
        });

        document.querySelectorAll('.start-mode-btn').forEach((button) => {
            button.addEventListener('click', () => {
                this.switchView('training');
                const mode = button.dataset.mode || 'flicking';
                document.querySelectorAll('.mode-btn').forEach((item) => item.classList.toggle('active', item.dataset.mode === mode));
            });
        });
    }

    initProfileForms() {
        document.getElementById('profileForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const displayName = document.getElementById('displayNameInput').value.trim();
            if (!displayName) {
                this.showNotification('显示名称不能为空');
                return;
            }

            try {
                await window.auth.updateProfile(displayName);
                this.showNotification('资料已更新');
            } catch (error) {
                this.showNotification(error.message);
            }
        });

        document.getElementById('passwordForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const oldPassword = document.getElementById('oldPasswordInput').value;
            const newPassword = document.getElementById('newPasswordInput').value;

            try {
                await window.auth.changePassword(oldPassword, newPassword);
                event.target.reset();
                this.showNotification('密码修改成功');
            } catch (error) {
                this.showNotification(error.message);
            }
        });
    }

    initDataActions() {
        document.getElementById('exportDataBtn')?.addEventListener('click', () => window.app.exportData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => window.app.importData());
        document.getElementById('resetDataBtn')?.addEventListener('click', () => window.app.resetData());
    }

    initCursor() {
        this.updateCursor();
    }

    toggleAuthModal(visible) {
        document.getElementById('authModal')?.classList.toggle('active', visible);
    }

    updateAuthUI(user) {
        document.getElementById('guestActions')?.classList.toggle('hidden', Boolean(user));
        document.getElementById('userMenu')?.classList.toggle('hidden', !user);
        document.getElementById('accountGuestState')?.classList.toggle('hidden', Boolean(user));
        document.getElementById('accountUserState')?.classList.toggle('hidden', !user);

        if (user) {
            this.setText('userDisplayName', user.displayName || user.username);
            this.setText('userUsername', `@${user.username}`);
            this.setText('accountDisplayName', user.displayName || user.username);
            this.setText('accountDescription', '你的训练数据会自动保存在服务器，并可跨设备继续使用。');
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                avatar.style.background = user.avatarColor || '#ff4d6d';
                avatar.textContent = (user.displayName || user.username || 'S').slice(0, 1).toUpperCase();
            }
            const profileInput = document.getElementById('displayNameInput');
            if (profileInput) {
                profileInput.value = user.displayName || user.username;
            }
        } else {
            this.setText('accountDisplayName', '访客模式');
            this.setText('accountDescription', '先试玩也没问题，注册后可以把本地进度一键同步到账号。');
        }
    }

    renderAchievements() {
        const container = document.getElementById('achievementsList');
        if (!container) return;

        const achievements = this.storage.getAchievements();
        container.innerHTML = this.achievementMeta
            .map((item) => {
                const unlocked = Boolean(achievements[item.key]);
                return `
                    <article class="achievement-item ${unlocked ? 'completed' : 'locked'}">
                        <div class="achievement-icon">${item.icon}</div>
                        <div class="achievement-info">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                        </div>
                        <span class="achievement-state">${unlocked ? '已解锁' : '未达成'}</span>
                    </article>
                `;
            })
            .join('');
    }

    switchView(view) {
        document.querySelectorAll('.view').forEach((element) => element.classList.toggle('active', element.id === `${view}-view`));
        document.querySelectorAll('.nav-btn').forEach((element) => element.classList.toggle('active', element.dataset.view === view));

        if (view === 'training' && window.gameEngine) {
            setTimeout(() => window.gameEngine.resizeCanvas(), 120);
        }

        if (view === 'stats' && window.statsManager) {
            window.statsManager.updateStats();
        }

        this.updateCursor();
    }

    loadSettings() {
        const sensitivityConfig = this.storage.getSensitivityConfig();
        this.settings = this.storage.getSettings();

        document.getElementById('hudEnabled').checked = this.settings.hudEnabled;
        document.getElementById('mouseTrailEnabled').value = this.settings.mouseTrailEnabled || 'global';
        document.getElementById('particlesEnabled').checked = this.settings.particlesEnabled;
        document.getElementById('soundEnabled').value = this.settings.soundEnabled || 'global';
        document.getElementById('cursorType').value = this.settings.cursorType;
        document.getElementById('cursorSize').value = this.settings.cursorSize;
        document.getElementById('cursorSizeValue').textContent = `${this.settings.cursorSize}px`;
        document.getElementById('cursorColor').value = this.settings.cursorColor;
        document.getElementById('cursorEnabled').value = this.settings.cursorEnabled || 'global';
        document.getElementById('gameSelect').value = sensitivityConfig.game;
        document.getElementById('sensitivity').value = sensitivityConfig.sensitivity;
        document.getElementById('sensitivityInput').value = sensitivityConfig.sensitivity;
        document.getElementById('dpi').value = sensitivityConfig.dpi;
        document.getElementById('cm360Value').textContent = Number(sensitivityConfig.cm360).toFixed(2);
        this.updateSensitivityRange(sensitivityConfig.game);
    }

    updateSensitivityRange(gameId) {
        const game = window.Sensitivity.GAMES.find((item) => item.id === gameId);
        if (!game) return;

        const slider = document.getElementById('sensitivity');
        slider.min = game.sensRange.min;
        slider.max = game.sensRange.max;
        slider.step = game.sensRange.step;
    }

    updateSensitivityDisplay() {
        const gameId = document.getElementById('gameSelect').value;
        const sensitivity = parseFloat(document.getElementById('sensitivityInput').value);
        const dpi = parseInt(document.getElementById('dpi').value, 10);
        const result = window.Sensitivity.calculateFromGame(gameId, sensitivity, dpi);
        document.getElementById('cm360Value').textContent = result.cm360.toFixed(2);
    }

    async saveSettings() {
        const settings = {
            hudEnabled: document.getElementById('hudEnabled').checked,
            mouseTrailEnabled: document.getElementById('mouseTrailEnabled').value,
            particlesEnabled: document.getElementById('particlesEnabled').checked,
            soundEnabled: document.getElementById('soundEnabled').value,
            cursorType: document.getElementById('cursorType').value,
            cursorSize: parseInt(document.getElementById('cursorSize').value, 10),
            cursorColor: document.getElementById('cursorColor').value,
            cursorEnabled: document.getElementById('cursorEnabled').value
        };

        const gameId = document.getElementById('gameSelect').value;
        const sensitivity = parseFloat(document.getElementById('sensitivityInput').value);
        const dpi = parseInt(document.getElementById('dpi').value, 10);
        const sensitivityConfig = window.Sensitivity.calculateFromGame(gameId, sensitivity, dpi);
        sensitivityConfig.game = gameId;
        sensitivityConfig.sensitivity = sensitivity;
        sensitivityConfig.dpi = dpi;

        this.storage.saveSettings(settings);
        this.storage.saveSensitivityConfig(sensitivityConfig);
        this.settings = settings;

        if (window.gameEngine) {
            window.gameEngine.settings = settings;
        }

        if (window.audioManager) {
            window.audioManager.soundSetting = settings.soundEnabled;
        }

        if (window.auth && window.auth.isLoggedIn()) {
            try {
                await window.auth.syncGameData({ settings, sensitivityConfig });
            } catch (error) {
                console.error('同步设置失败:', error.message);
            }
        }

        this.updateCursor();
        this.showNotification('设置已保存');
    }

    updateCursor() {
        const cursorType = document.getElementById('cursorType')?.value || this.settings.cursorType;
        const cursorSize = parseInt(document.getElementById('cursorSize')?.value || this.settings.cursorSize, 10);
        const cursorColor = document.getElementById('cursorColor')?.value || this.settings.cursorColor;
        const cursorEnabled = document.getElementById('cursorEnabled')?.value || this.settings.cursorEnabled || 'global';
        const gameState = window.gameEngine?.gameState || 'menu';
        const shouldShowCustomCursor = cursorEnabled === 'global' || (cursorEnabled === 'game' && gameState === 'playing');

        if (!shouldShowCustomCursor) {
            document.body.style.cursor = 'auto';
            return;
        }

        if (cursorType === 'default') {
            document.body.style.cursor = 'auto';
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = cursorSize;
        canvas.height = cursorSize;
        const ctx = canvas.getContext('2d');

        if (cursorType === 'crosshair') {
            ctx.strokeStyle = cursorColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cursorSize / 2, 0);
            ctx.lineTo(cursorSize / 2, cursorSize);
            ctx.moveTo(0, cursorSize / 2);
            ctx.lineTo(cursorSize, cursorSize / 2);
            ctx.stroke();
        }

        if (cursorType === 'dot') {
            ctx.fillStyle = cursorColor;
            ctx.beginPath();
            ctx.arc(cursorSize / 2, cursorSize / 2, cursorSize / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (cursorType === 'circle') {
            ctx.strokeStyle = cursorColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cursorSize / 2, cursorSize / 2, cursorSize / 2 - 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        document.body.style.cursor = `url(${canvas.toDataURL('image/png')}) ${cursorSize / 2} ${cursorSize / 2}, auto`;
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'toast';
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => notification.classList.add('visible'));
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 240);
        }, 2200);
    }
}
