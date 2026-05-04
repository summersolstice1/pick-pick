class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();
        this.storage = new StorageManager();
        this.settings = this.storage.getSettings();

        this.gameState = 'menu';
        this.gameMode = 'flicking';
        this.difficulty = 'normal';
        this.gameDuration = 30;
        this.targetSize = 'medium';

        this.score = 0;
        this.hits = 0;
        this.shots = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.accuracy = 100;
        this.reactionTimes = [];

        this.timer = 0;
        this.startTime = 0;
        this.gameOverTime = 0;

        this.targets = [];
        this.targetSpeed = 2;
        this.targetSpawnRate = 1000;
        this.lastTargetSpawn = 0;

        this.mousePos = { x: 0, y: 0 };
        this.mouseTrail = [];
        this.particles = [];
        this.modeManager = null;
        this.lastResultSummary = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (event) => this.updateMousePos(event));
        window.addEventListener('click', (event) => this.handleClick(event));
        this.initModeManager();
        requestAnimationFrame(() => this.gameLoop());
    }

    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
    }

    updateMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        const mouseTrailEnabled = this.settings.mouseTrailEnabled;
        if (mouseTrailEnabled === 'global' || (mouseTrailEnabled === 'game' && this.gameState === 'playing')) {
            if (this.mouseTrail.length > 8) {
                this.mouseTrail.shift();
            }

            const lastTrail = this.mouseTrail[this.mouseTrail.length - 1];
            if (!lastTrail || Math.abs(lastTrail.x - this.mousePos.x) > 5 || Math.abs(lastTrail.y - this.mousePos.y) > 5) {
                this.mouseTrail.push({
                    x: Math.max(0, Math.min(this.canvas.width, this.mousePos.x)),
                    y: Math.max(0, Math.min(this.canvas.height, this.mousePos.y)),
                    time: Date.now()
                });
            }
        }
    }

    handleClick(event) {
        if (this.gameState !== 'playing') return;
        if (this.gameMode === 'tracking') return;

        const rect = this.canvas.getBoundingClientRect();
        const clickPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        this.shots += 1;
        let hit = false;

        if (this.modeManager[this.gameMode] && this.modeManager[this.gameMode].handleClick) {
            hit = this.modeManager[this.gameMode].handleClick(clickPos);
        } else {
            for (let index = this.targets.length - 1; index >= 0; index -= 1) {
                const target = this.targets[index];
                if (this.isHit(clickPos, target)) {
                    this.handleTargetHit(target, index);
                    hit = true;
                    break;
                }
            }
        }

        if (!hit) {
            this.combo = 0;
            this.audio.playError();
        }

        this.updateAccuracy();
    }

    isHit(clickPos, target) {
        const dx = clickPos.x - target.x;
        const dy = clickPos.y - target.y;
        return Math.sqrt(dx * dx + dy * dy) <= target.radius;
    }

    handleTargetHit(target, index) {
        this.hits += 1;
        this.score += 10 + this.combo * 2;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const reactionTime = Date.now() - target.spawnTime;
        this.reactionTimes.push(reactionTime);

        this.audio.playClick();
        if (this.combo % 10 === 0) {
            this.audio.playCombo(this.combo);
        }

        this.createParticles(target.x, target.y);
        this.targets.splice(index, 1);
    }

    createParticles(x, y) {
        if (!this.settings.particlesEnabled) return;

        for (let i = 0; i < 8; i += 1) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateAccuracy() {
        if (this.shots > 0) {
            this.accuracy = Math.round((this.hits / this.shots) * 100);
        }
    }

    initModeManager() {
        this.modeManager = {
            flicking: new FlickingMode(this),
            tracking: new TrackingMode(this),
            switching: new SwitchingMode(this),
            reflex: new ReflexMode(this),
            sixtarget: new SixTargetMode(this),
            dpi: new DpiTestMode(this)
        };
    }

    startGame(mode, difficulty, targetSize, duration) {
        this.settings = this.storage.getSettings();
        this.gameMode = mode;
        this.difficulty = difficulty;
        this.targetSize = targetSize;
        this.gameDuration = duration;

        this.score = 0;
        this.hits = 0;
        this.shots = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.accuracy = 100;
        this.reactionTimes = [];
        this.targets = [];
        this.particles = [];
        this.mouseTrail = [];
        this.lastResultSummary = null;

        this.gameState = 'playing';
        this.startTime = Date.now();
        this.timer = duration;

        this.resizeCanvas();
        this.audio.playGameStart();

        if (this.modeManager[this.gameMode]) {
            this.modeManager[this.gameMode].init();
        }
    }

    endGame() {
        this.gameState = 'gameOver';
        this.gameOverTime = Date.now();
        this.audio.playGameEnd();
        this.lastResultSummary = this.buildResultSummary();
        this.saveGameData(this.lastResultSummary);
        this.showResult(this.lastResultSummary);
    }

    buildResultSummary() {
        const activeMode = this.modeManager[this.gameMode];
        const fallbackAverage =
            this.reactionTimes.length > 0
                ? Math.round(this.reactionTimes.reduce((sum, value) => sum + value, 0) / this.reactionTimes.length)
                : 0;
        const avgReactionTime =
            activeMode && typeof activeMode.getAverageReactionTime === 'function'
                ? activeMode.getAverageReactionTime()
                : fallbackAverage;
        const insight =
            activeMode && typeof activeMode.getResultSummary === 'function'
                ? activeMode.getResultSummary({
                      accuracy: this.accuracy,
                      score: this.score,
                      hits: this.hits,
                      shots: this.shots,
                      maxCombo: this.maxCombo,
                      avgReactionTime,
                      duration: this.gameDuration
                  })
                : null;

        return {
            avgReactionTime,
            insight
        };
    }

    async saveGameData(resultSummary = this.lastResultSummary) {
        const avgReactionTime = resultSummary?.avgReactionTime || 0;

        const session = {
            mode: this.gameMode,
            score: this.score,
            accuracy: this.accuracy,
            hits: this.hits,
            shots: this.shots,
            maxCombo: this.maxCombo,
            avgReactionTime,
            duration: this.gameDuration,
            date: new Date().toISOString(),
            insightTitle: resultSummary?.insight?.title || '',
            insightBody: resultSummary?.insight?.body || ''
        };

        if (window.statsManager) {
            await window.statsManager.recordSession(session);
        }

        await this.updateAchievements(avgReactionTime);
    }

    async updateAchievements(avgReactionTime) {
        const achievements = this.storage.getAchievements();
        const stats = this.storage.getStats();

        if (stats.totalGames >= 1) achievements.beginner = true;
        if (this.accuracy >= 80) achievements.sharpshooter = true;
        if (this.maxCombo >= 100) achievements.comboMaster = true;
        if (avgReactionTime > 0 && avgReactionTime < 100) achievements.quickReaction = true;
        if (this.hits === this.shots && this.shots > 0) achievements.perfectionist = true;
        if (stats.totalGames >= 100) achievements.persistent = true;
        if (this.score >= 1000) achievements.highScorer = true;
        if (this.maxCombo >= 10) achievements.comboNovice = true;
        if (this.maxCombo >= 50) achievements.comboExpert = true;
        if (this.accuracy >= 95) achievements.precisionMaster = true;
        if (avgReactionTime > 0 && avgReactionTime < 50) achievements.lightningReaction = true;
        if (stats.totalGames >= 10) achievements.gameEnthusiast = true;
        if (stats.totalGames >= 50) achievements.gameMaster = true;

        const playedModes = new Set(stats.games.map((game) => game.mode));
        if (playedModes.size >= 5) {
            achievements.jackOfAllTrades = true;
        }

        this.storage.saveAchievements(achievements);
        window.ui?.renderAchievements();

        if (window.auth && window.auth.isLoggedIn()) {
            try {
                await window.auth.syncGameData({ achievements });
            } catch (error) {
                console.error('同步成就失败:', error.message);
            }
        }
    }

    showResult(resultSummary = this.lastResultSummary) {
        const avgReactionTime = resultSummary?.avgReactionTime || 0;
        const insight = resultSummary?.insight || null;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHits').textContent = this.hits;
        document.getElementById('finalAccuracy').textContent = `${this.accuracy}%`;
        document.getElementById('finalAvgTime').textContent = `${avgReactionTime}ms`;

        const insightElement = document.getElementById('resultInsight');
        const insightTitleElement = document.getElementById('resultInsightTitle');
        const insightBodyElement = document.getElementById('resultInsightBody');

        if (insight && insight.body) {
            insightTitleElement.textContent = insight.title || '测试分析';
            insightBodyElement.textContent = insight.body;
            insightElement.classList.remove('hidden');
        } else {
            insightTitleElement.textContent = '测试分析';
            insightBodyElement.textContent = '';
            insightElement.classList.add('hidden');
        }

        document.getElementById('gameResult').classList.remove('hidden');
    }

    update() {
        if (this.gameState !== 'playing') return;

        const elapsed = (Date.now() - this.startTime) / 1000;
        this.timer = Math.max(0, this.gameDuration - elapsed);

        if (this.timer <= 0) {
            this.endGame();
            return;
        }

        if (this.modeManager[this.gameMode]) {
            this.modeManager[this.gameMode].update();
        }

        this.updateParticles();
        this.updateHUD();
    }

    updateParticles() {
        for (let index = this.particles.length - 1; index >= 0; index -= 1) {
            const particle = this.particles[index];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;

            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        }
    }

    updateHUD() {
        const hudElement = document.querySelector('.hud');
        if (hudElement) {
            hudElement.classList.toggle('hidden', !this.settings.hudEnabled);
        }

        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('accuracy').textContent = `${this.accuracy}%`;
        document.getElementById('hits').textContent = this.hits;
        document.getElementById('timerText').textContent = `${Math.ceil(this.timer)}s`;

        const progress = (this.timer / this.gameDuration) * 220;
        const timerProgress = document.getElementById('timerProgress');
        if (timerProgress) {
            timerProgress.style.strokeDashoffset = 220 - progress;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.settings.mouseTrailEnabled === 'global' || this.gameState === 'playing') {
            this.renderMouseTrail();
        }

        if (this.gameState === 'playing' && this.modeManager[this.gameMode]) {
            this.modeManager[this.gameMode].render();
            this.renderParticles();
        }
    }

    renderMouseTrail() {
        const mouseTrailEnabled = this.settings.mouseTrailEnabled;
        if ((mouseTrailEnabled !== 'global' && mouseTrailEnabled !== 'game') || this.mouseTrail.length < 2) return;
        if (mouseTrailEnabled === 'game' && this.gameState !== 'playing') return;

        const currentTime = Date.now();
        this.mouseTrail = this.mouseTrail.filter((trail) => currentTime - trail.time < 100);
        if (this.mouseTrail.length < 2) return;

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
        for (let i = 1; i < this.mouseTrail.length; i += 1) {
            this.ctx.moveTo(this.mouseTrail[i - 1].x, this.mouseTrail[i - 1].y);
            this.ctx.lineTo(this.mouseTrail[i].x, this.mouseTrail[i].y);
        }
        this.ctx.stroke();
    }

    renderParticles() {
        this.particles.forEach((particle) => {
            this.ctx.fillStyle = `rgba(255, 77, 109, ${particle.life * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    getTargetSize() {
        const sizes = {
            tiny: 10,
            small: 15,
            medium: 20,
            large: 30,
            huge: 40
        };
        return sizes[this.targetSize] || 20;
    }

    getTargetSpeed() {
        const speeds = {
            easy: 0.75,
            normal: 1.35,
            hard: 2.1,
            insane: 2.8
        };
        return speeds[this.difficulty] || 2;
    }

    getTargetSpawnRate() {
        const rates = {
            easy: 1900,
            normal: 1350,
            hard: 950,
            insane: 700
        };
        return rates[this.difficulty] || 1000;
    }
}
