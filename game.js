// 游戏配置
const config = {
    targetSize: 20,
    spawnRate: 500,
    lingerTime: 1500,
    movementSpeed: 0,
    gameDuration: 30000,
    isAdaptive: false
};

// 游戏状态
const GameState = {
    INIT: 'init',
    IDLE: 'idle',
    COUNTDOWN: 'countdown',
    RUNNING: 'running',
    ENDED: 'ended',
    RESULT: 'result'
};

// 游戏变量
let gameState = GameState.INIT;
let canvas, ctx;
let targets = [];
let particles = [];
let score = 0;
let combo = 0;
let hits = 0;
let totalClicks = 0;
let misses = 0;
let gameTime = 0;
let startTime = 0;
let lastSpawnTime = 0;
let mouseX = 0;
let mouseY = 0;
let reactionTimes = [];
let accuracyTrend = [];
let offsetDistances = [];
let mouseTrail = [];
let clickPoints = []; // 记录点击点
let isSoundEnabled = true;
let isParticlesEnabled = true;
let currentCursor = 'default';

// DOM元素
const startMenu = document.getElementById('startMenu');
const resultModal = document.getElementById('resultModal');
const settingsModal = document.getElementById('settingsModal');
const cursorModal = document.getElementById('cursorModal');
const achievementsModal = document.getElementById('achievementsModal');

const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const accuracyElement = document.getElementById('accuracy');
const hitsElement = document.getElementById('hits');
const timerText = document.getElementById('timerText');
const timerProgress = document.getElementById('timerProgress');

const finalHitsElement = document.getElementById('finalHits');
const finalAccuracyElement = document.getElementById('finalAccuracy');
const finalAvgTimeElement = document.getElementById('finalAvgTime');
const finalOffsetElement = document.getElementById('finalOffset');

// 初始化游戏
function init() {
    // 获取画布和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 监听鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // 初始化UI事件
    initUIEvents();
    
    // 加载本地存储
    loadSettings();
    
    // 初始化游戏状态
    gameState = GameState.IDLE;
    
    // 开始游戏循环
    gameLoop();
}

// 调整画布大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 游戏配置扩展
const gameConfig = {
    targetColor: '#FF0000',
    targetSize: 'medium',
    customTargetSize: 20,
    difficulty: 'normal',
    gameMode: 'system',
    hudEnabled: true,
    mouseTrailEnabled: true,
    cursorSize: 20,
    cursorColor: '#FF0000'
};

// 初始化UI事件
function initUIEvents() {
    // 开始游戏按钮
    document.getElementById('startBtn').addEventListener('click', startGame);
    
    // 难度按钮
    document.getElementById('easyBtn').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('normalBtn').addEventListener('click', () => setDifficulty('normal'));
    document.getElementById('mediumBtn').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('hardBtn').addEventListener('click', () => setDifficulty('hard'));
    document.getElementById('insaneBtn').addEventListener('click', () => setDifficulty('insane'));
    
    // 目标颜色选择
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameConfig.targetColor = btn.dataset.color;
            updateThemeColor(gameConfig.targetColor);
            saveSettings();
        });
    });
    
    // 目标尺寸选择
    document.getElementById('tinySize').addEventListener('click', () => setTargetSize('tiny'));
    document.getElementById('smallSize').addEventListener('click', () => setTargetSize('small'));
    document.getElementById('mediumSize').addEventListener('click', () => setTargetSize('medium'));
    document.getElementById('largeSize').addEventListener('click', () => setTargetSize('large'));
    document.getElementById('hugeSize').addEventListener('click', () => setTargetSize('huge'));
    document.getElementById('customSize').addEventListener('click', () => setTargetSize('custom'));
    
    // 自定义尺寸输入
    document.getElementById('customSizeInput').addEventListener('change', function() {
        const size = parseInt(this.value);
        if (size >= 5 && size <= 50) {
            gameConfig.customTargetSize = size;
            if (gameConfig.targetSize === 'custom') {
                config.targetSize = size;
            }
            saveSettings();
        }
    });
    
    // 游戏时长调整
    document.getElementById('decreaseTime').addEventListener('click', () => adjustGameTime(-10));
    document.getElementById('increaseTime').addEventListener('click', () => adjustGameTime(10));
    
    // 游戏模式
    document.getElementById('systemMode').addEventListener('click', () => setGameMode('system'));
    document.getElementById('agileMode').addEventListener('click', () => setGameMode('agile'));
    document.getElementById('precisionMode').addEventListener('click', () => setGameMode('precision'));
    
    // HUD开关
    document.getElementById('hudEnabled').addEventListener('change', (e) => {
        gameConfig.hudEnabled = e.target.checked;
        saveSettings();
        updateHUDVisibility();
    });
    
    // 鼠标轨迹开关
    document.getElementById('mouseTrailEnabled').addEventListener('change', (e) => {
        gameConfig.mouseTrailEnabled = e.target.checked;
        saveSettings();
    });
    
    // 粒子效果开关
    document.getElementById('particlesEnabled').addEventListener('change', (e) => {
        isParticlesEnabled = e.target.checked;
        saveSettings();
    });
    
    // 设置按钮
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    
    // 关闭设置
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    
    // 光标设置
    document.getElementById('cursorSettingsBtn')?.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        cursorModal.classList.remove('hidden');
    });
    
    // 保存光标
    document.getElementById('saveCursorBtn').addEventListener('click', saveCursorSettings);
    
    // 关闭光标设置
    document.getElementById('closeCursorBtn').addEventListener('click', () => {
        cursorModal.classList.add('hidden');
    });
    
    // 光标类型选择
    document.querySelectorAll('.cursor-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cursor-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCursor = btn.dataset.cursor;
            updateCursorPreview();
        });
    });
    
    // 光标大小调整
    document.getElementById('cursorSize').addEventListener('input', function() {
        gameConfig.cursorSize = parseInt(this.value);
        document.getElementById('cursorSizeValue').textContent = `${this.value}px`;
        updateCursorPreview();
    });
    
    // 光标颜色选择
    document.getElementById('cursorColor').addEventListener('change', function() {
        gameConfig.cursorColor = this.value;
        updateCursorPreview();
    });
    
    // 成就按钮
    document.getElementById('achievementsBtn')?.addEventListener('click', () => {
        achievementsModal.classList.remove('hidden');
    });
    
    // 关闭成就
    document.getElementById('closeAchievementsBtn').addEventListener('click', () => {
        achievementsModal.classList.add('hidden');
    });
    
    // 再玩一次
    document.getElementById('playAgainBtn').addEventListener('click', startGame);
    
    // 返回菜单
    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        resultModal.classList.add('hidden');
        startMenu.classList.remove('hidden');
        gameState = GameState.IDLE;
    });
    
    // 音效开关
    document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
        isSoundEnabled = e.target.checked;
        saveSettings();
    });
    
    // Discord按钮
    document.querySelector('.discord-button').addEventListener('click', () => {
        window.open('https://discord.com', '_blank');
    });
}

// 设置目标尺寸
function setTargetSize(size) {
    document.getElementById('tinySize').classList.remove('active');
    document.getElementById('smallSize').classList.remove('active');
    document.getElementById('mediumSize').classList.remove('active');
    document.getElementById('largeSize').classList.remove('active');
    document.getElementById('hugeSize').classList.remove('active');
    document.getElementById('customSize').classList.remove('active');
    document.getElementById(`${size}Size`).classList.add('active');
    
    gameConfig.targetSize = size;
    
    // 更新目标大小配置
    switch(size) {
        case 'tiny':
            config.targetSize = 5;
            break;
        case 'small':
            config.targetSize = 12;
            break;
        case 'medium':
            config.targetSize = 20;
            break;
        case 'large':
            config.targetSize = 30;
            break;
        case 'huge':
            config.targetSize = 45;
            break;
        case 'custom':
            config.targetSize = gameConfig.customTargetSize;
            break;
    }
    
    saveSettings();
}

// 更新HUD可见性
function updateHUDVisibility() {
    const hud = document.querySelector('.hud');
    if (gameConfig.hudEnabled) {
        hud.style.display = 'flex';
    } else {
        hud.style.display = 'none';
    }
}

// 更新主题色
function updateThemeColor(color) {
    // 更新Logo颜色
    const logo = document.querySelector('.logo h1');
    if (logo) {
        logo.style.color = color;
    }
    
    // 更新设置边框颜色
    const settings = document.querySelector('.settings');
    if (settings) {
        settings.style.borderColor = color;
    }
    
    // 更新开始按钮颜色
    const startButton = document.querySelector('.start-button');
    if (startButton) {
        startButton.style.backgroundColor = color;
    }
    
    // 更新轨迹回放画布边框颜色
    const trajectoryCanvas = document.getElementById('trajectoryCanvas');
    if (trajectoryCanvas) {
        trajectoryCanvas.style.borderColor = color;
    }
    
    // 更新HUD文字阴影颜色
    const hudElements = document.querySelectorAll('.score, .combo, .accuracy, .hits');
    hudElements.forEach(element => {
        element.style.textShadow = `0 0 10px ${color}80`;
    });
    
    // 更新计时器进度条颜色
    const timerProgress = document.getElementById('timerProgress');
    if (timerProgress) {
        timerProgress.style.stroke = color;
    }
    
    // 更新按钮边框和悬停颜色
    const buttons = document.querySelectorAll('.difficulty-buttons button, .size-buttons button, .mode-buttons button');
    buttons.forEach(button => {
        button.style.borderColor = color;
        button.addEventListener('hover', function() {
            this.style.backgroundColor = color;
        });
    });
}

// 设置难度
function setDifficulty(difficulty) {
    document.getElementById('easyBtn').classList.remove('active');
    document.getElementById('normalBtn').classList.remove('active');
    document.getElementById('mediumBtn').classList.remove('active');
    document.getElementById('hardBtn').classList.remove('active');
    document.getElementById('insaneBtn').classList.remove('active');
    
    // 根据难度设置对应的按钮为active
    switch(difficulty) {
        case 'easy':
            document.getElementById('easyBtn').classList.add('active');
            config.spawnRate = 800;
            config.lingerTime = 2500;
            config.movementSpeed = 0;
            break;
        case 'normal':
            document.getElementById('normalBtn').classList.add('active');
            config.spawnRate = 600;
            config.lingerTime = 2000;
            config.movementSpeed = 1;
            break;
        case 'medium':
            document.getElementById('mediumBtn').classList.add('active');
            config.spawnRate = 450;
            config.lingerTime = 1500;
            config.movementSpeed = 2;
            break;
        case 'hard':
            document.getElementById('hardBtn').classList.add('active');
            config.spawnRate = 300;
            config.lingerTime = 1000;
            config.movementSpeed = 3;
            break;
        case 'insane':
            document.getElementById('insaneBtn').classList.add('active');
            config.spawnRate = 200;
            config.lingerTime = 700;
            config.movementSpeed = 5;
            break;
    }
    
    gameConfig.difficulty = difficulty;
    saveSettings();
}

// 调整游戏时长
function adjustGameTime(delta) {
    config.gameDuration = Math.max(10000, Math.min(300000, config.gameDuration + delta * 1000));
    const seconds = Math.floor(config.gameDuration / 1000);
    document.getElementById('gameTimeValue').textContent = `${seconds}s`;
    saveSettings();
}

// 设置游戏模式
function setGameMode(mode) {
    document.getElementById('systemMode').classList.remove('active');
    document.getElementById('agileMode').classList.remove('active');
    document.getElementById('precisionMode').classList.remove('active');
    document.getElementById(`${mode}Mode`).classList.add('active');
    
    gameConfig.gameMode = mode;
    
    // 根据游戏模式设置参数
    switch(mode) {
        case 'system':
            config.spawnRate = 500;
            config.lingerTime = 1500;
            config.movementSpeed = 2;
            break;
        case 'agile':
            config.spawnRate = 300;
            config.lingerTime = 1000;
            config.movementSpeed = 4;
            break;
        case 'precision':
            config.spawnRate = 600;
            config.lingerTime = 2000;
            config.movementSpeed = 1;
            break;
    }
    
    saveSettings();
}

// 保存光标设置
function saveCursorSettings() {
    localStorage.setItem('cursorType', currentCursor);
    updateCursor();
    cursorModal.classList.add('hidden');
}

// 更新光标预览
function updateCursorPreview() {
    const previewArea = document.getElementById('cursorPreview');
    previewArea.style.cursor = getCursorStyle(currentCursor);
    previewArea.style.setProperty('--cursor-size', gameConfig.cursorSize + 'px');
    previewArea.style.setProperty('--cursor-color', gameConfig.cursorColor);
}

// 获取光标样式
function getCursorStyle(cursorType) {
    switch(cursorType) {
        case 'default':
            return 'default';
        case 'crosshair':
            return 'crosshair';
        case 'dot':
            return 'pointer';
        case 'pointer':
            return 'pointer';
        case 'circle':
            return 'circle';
        case 'custom':
            return 'none'; // 使用自定义光标
        default:
            return 'default';
    }
}

// 更新光标
function updateCursor() {
    document.body.style.cursor = getCursorStyle(currentCursor);
    document.body.style.setProperty('--cursor-size', gameConfig.cursorSize + 'px');
    document.body.style.setProperty('--cursor-color', gameConfig.cursorColor);
    
    // 对于自定义光标，使用CSS生成
    if (currentCursor === 'custom') {
        document.body.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${gameConfig.cursorSize}' height='${gameConfig.cursorSize}' viewBox='0 0 ${gameConfig.cursorSize} ${gameConfig.cursorSize}'%3E%3Ccircle cx='${gameConfig.cursorSize/2}' cy='${gameConfig.cursorSize/2}' r='${gameConfig.cursorSize/4}' fill='${gameConfig.cursorColor}'%3E%3C/circle%3E%3C/svg%3E"), auto`;
    }
}

// 加载设置
function loadSettings() {
    const savedTargetSize = localStorage.getItem('targetSize');
    const savedGameDuration = localStorage.getItem('gameDuration');
    const savedMovementSpeed = localStorage.getItem('movementSpeed');
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    const savedParticlesEnabled = localStorage.getItem('particlesEnabled');
    const savedCursor = localStorage.getItem('cursorType');
    const savedTargetColor = localStorage.getItem('targetColor');
    const savedTargetSizeOption = localStorage.getItem('targetSizeOption');
    const savedCustomTargetSize = localStorage.getItem('customTargetSize');
    const savedDifficulty = localStorage.getItem('difficulty');
    const savedGameMode = localStorage.getItem('gameMode');
    const savedHudEnabled = localStorage.getItem('hudEnabled');
    const savedMouseTrailEnabled = localStorage.getItem('mouseTrailEnabled');
    const savedCursorSize = localStorage.getItem('cursorSize');
    const savedCursorColor = localStorage.getItem('cursorColor');
    
    if (savedTargetSize) config.targetSize = parseInt(savedTargetSize);
    if (savedGameDuration) config.gameDuration = parseInt(savedGameDuration);
    if (savedMovementSpeed) config.movementSpeed = parseInt(savedMovementSpeed);
    if (savedSoundEnabled) isSoundEnabled = savedSoundEnabled === 'true';
    if (savedParticlesEnabled) isParticlesEnabled = savedParticlesEnabled === 'true';
    if (savedCursor) currentCursor = savedCursor;
    if (savedTargetColor) gameConfig.targetColor = savedTargetColor;
    if (savedTargetSizeOption) gameConfig.targetSize = savedTargetSizeOption;
    if (savedCustomTargetSize) gameConfig.customTargetSize = parseInt(savedCustomTargetSize);
    if (savedDifficulty) gameConfig.difficulty = savedDifficulty;
    if (savedGameMode) gameConfig.gameMode = savedGameMode;
    if (savedHudEnabled) gameConfig.hudEnabled = savedHudEnabled === 'true';
    if (savedMouseTrailEnabled) gameConfig.mouseTrailEnabled = savedMouseTrailEnabled === 'true';
    if (savedCursorSize) gameConfig.cursorSize = parseInt(savedCursorSize);
    if (savedCursorColor) gameConfig.cursorColor = savedCursorColor;
    
    // 更新UI
    document.getElementById('gameTimeValue').textContent = `${Math.floor(config.gameDuration / 1000)}s`;
    document.getElementById('hudEnabled').checked = gameConfig.hudEnabled;
    document.getElementById('mouseTrailEnabled').checked = gameConfig.mouseTrailEnabled;
    document.getElementById('particlesEnabled').checked = isParticlesEnabled;
    document.getElementById('customSizeInput').value = gameConfig.customTargetSize;
    document.getElementById('cursorSize').value = gameConfig.cursorSize;
    document.getElementById('cursorSizeValue').textContent = `${gameConfig.cursorSize}px`;
    document.getElementById('cursorColor').value = gameConfig.cursorColor;
    updateCursor();
    updateHUDVisibility();
    updateThemeColor(gameConfig.targetColor);
    
    // 更新目标颜色选择
    document.querySelectorAll('.color-option').forEach(btn => {
        if (btn.dataset.color === gameConfig.targetColor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新目标尺寸选择
    document.getElementById('tinySize').classList.remove('active');
    document.getElementById('smallSize').classList.remove('active');
    document.getElementById('mediumSize').classList.remove('active');
    document.getElementById('largeSize').classList.remove('active');
    document.getElementById('hugeSize').classList.remove('active');
    const sizeId = gameConfig.targetSize + 'Size';
    if (document.getElementById(sizeId)) {
        document.getElementById(sizeId).classList.add('active');
    }
    
    // 更新难度选择
    document.getElementById('easyBtn').classList.remove('active');
    document.getElementById('normalBtn').classList.remove('active');
    document.getElementById('mediumBtn').classList.remove('active');
    document.getElementById('hardBtn').classList.remove('active');
    document.getElementById('insaneBtn').classList.remove('active');
    const diffId = gameConfig.difficulty + 'Btn';
    if (document.getElementById(diffId)) {
        document.getElementById(diffId).classList.add('active');
    }
    
    // 更新游戏模式选择
    document.getElementById('systemMode').classList.remove('active');
    document.getElementById('agileMode').classList.remove('active');
    document.getElementById('precisionMode').classList.remove('active');
    document.getElementById(`${gameConfig.gameMode}Mode`).classList.add('active');
    
    // 更新光标选择
    document.querySelectorAll('.cursor-option').forEach(btn => {
        if (btn.dataset.cursor === currentCursor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 保存设置
function saveSettings() {
    localStorage.setItem('targetSize', config.targetSize);
    localStorage.setItem('gameDuration', config.gameDuration);
    localStorage.setItem('movementSpeed', config.movementSpeed);
    localStorage.setItem('soundEnabled', isSoundEnabled);
    localStorage.setItem('particlesEnabled', isParticlesEnabled);
    localStorage.setItem('targetColor', gameConfig.targetColor);
    localStorage.setItem('targetSizeOption', gameConfig.targetSize);
    localStorage.setItem('customTargetSize', gameConfig.customTargetSize);
    localStorage.setItem('difficulty', gameConfig.difficulty);
    localStorage.setItem('gameMode', gameConfig.gameMode);
    localStorage.setItem('hudEnabled', gameConfig.hudEnabled);
    localStorage.setItem('mouseTrailEnabled', gameConfig.mouseTrailEnabled);
    localStorage.setItem('cursorSize', gameConfig.cursorSize);
    localStorage.setItem('cursorColor', gameConfig.cursorColor);
}

// 开始游戏
function startGame() {
    startMenu.classList.add('hidden');
    resultModal.classList.add('hidden');
    
    // 重置游戏变量
    score = 0;
    combo = 0;
    hits = 0;
    totalClicks = 0;
    misses = 0;
    gameTime = 0;
    targets = [];
    particles = [];
    reactionTimes = [];
    accuracyTrend = [];
    offsetDistances = [];
    mouseTrail = [];
    clickPoints = [];
    
    // 更新UI
    updateHUD();
    
    // 开始倒计时
    gameState = GameState.COUNTDOWN;
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        if (countdown > 0) {
            // 显示倒计时
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '100px Arial';
            ctx.fillStyle = '#FF0000';
            ctx.textAlign = 'center';
            ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
            countdown--;
        } else {
            clearInterval(countdownInterval);
            // 开始游戏
            gameState = GameState.RUNNING;
            startTime = Date.now();
            lastSpawnTime = Date.now();
        }
    }, 1000);
}

// 游戏循环
function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    if (gameState === GameState.RUNNING) {
        // 计算游戏时间
        gameTime = Date.now() - startTime;
        
        // 检查游戏是否结束
        if (gameTime >= config.gameDuration) {
            endGame();
            return;
        }
        
        // 更新计时器
        updateTimer();
        
        // 生成目标
        if (Date.now() - lastSpawnTime > config.spawnRate) {
            spawnTarget();
            lastSpawnTime = Date.now();
        }
        
        // 更新和绘制目标
        updateTargets();
        
        // 更新和绘制粒子
        updateParticles();
        
        // 记录鼠标轨迹
        if (gameConfig.mouseTrailEnabled) {
            mouseTrail.push({ x: mouseX, y: mouseY, time: Date.now() });
        }
        
        // 绘制游戏内容
        drawGame();
    }
}

// 更新计时器
function updateTimer() {
    const remainingTime = Math.max(0, config.gameDuration - gameTime);
    const seconds = Math.ceil(remainingTime / 1000);
    timerText.textContent = `${seconds}s`;
    
    // 更新进度条
    const progress = 1 - (gameTime / config.gameDuration);
    const circumference = 2 * Math.PI * 35;
    const offset = circumference * (1 - progress);
    timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    timerProgress.style.strokeDashoffset = offset;
}

// 生成目标
function spawnTarget() {
    const padding = 50;
    const x = Math.random() * (canvas.width - padding * 2) + padding;
    const y = Math.random() * (canvas.height - padding * 2) + padding;
    
    let vx = 0;
    let vy = 0;
    
    if (config.movementSpeed > 0) {
        vx = (Math.random() - 0.5) * config.movementSpeed * 2;
        vy = (Math.random() - 0.5) * config.movementSpeed * 2;
    }
    
    targets.push({
        x,
        y,
        radius: config.targetSize,
        vx,
        vy,
        createdAt: Date.now(),
        color: gameConfig.targetColor
    });
}

// 更新目标
function updateTargets() {
    const currentTime = Date.now();
    
    targets = targets.filter(target => {
        // 检查目标是否过期
        if (currentTime - target.createdAt > config.lingerTime) {
            // 记录反应时间
            reactionTimes.push(config.lingerTime);
            return false;
        }
        
        // 更新移动目标
        if (config.movementSpeed > 0) {
            target.x += target.vx;
            target.y += target.vy;
            
            // 碰撞检测
            if (target.x - target.radius < 0 || target.x + target.radius > canvas.width) {
                target.vx *= -1;
            }
            if (target.y - target.radius < 0 || target.y + target.radius > canvas.height) {
                target.vy *= -1;
            }
        }
        
        return true;
    });
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制目标
    targets.forEach(target => {
        // 计算目标的生命周期
        const lifePercentage = (Date.now() - target.createdAt) / config.lingerTime;
        
        // 绘制外圆（光晕）
        const gradient = ctx.createRadialGradient(
            target.x, target.y, 0,
            target.x, target.y, target.radius * 1.5
        );
        gradient.addColorStop(0, `${target.color}80`);
        gradient.addColorStop(1, `${target.color}00`);
        
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制内圆
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = target.color;
        ctx.fill();
        
        // 时间预警效果
        if (lifePercentage > 0.7) {
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius * (1 - (lifePercentage - 0.7) * 3), 0, Math.PI * 2);
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // 绘制粒子
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    });
}

// 处理鼠标移动
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

// 处理鼠标点击
function handleMouseDown(e) {
    if (gameState !== GameState.RUNNING) return;
    
    totalClicks++;
    let hit = false;
    
    // 碰撞检测
    targets = targets.filter(target => {
        const distance = Math.sqrt(
            Math.pow(mouseX - target.x, 2) + Math.pow(mouseY - target.y, 2)
        );
        
        if (distance <= target.radius) {
            // 命中目标
            hit = true;
            score += 10 + combo;
            combo++;
            hits++;
            
            // 记录反应时间和偏移距离
            const reactionTime = Date.now() - target.createdAt;
            reactionTimes.push(reactionTime);
            offsetDistances.push(Math.round(distance));
            
            // 记录点击点（命中）
            clickPoints.push({ x: mouseX, y: mouseY, hit: true, time: Date.now() });
            
            // 生成粒子效果
            if (isParticlesEnabled) {
                createParticles(target.x, target.y, target.color);
            }
            
            // 播放音效
            if (isSoundEnabled) {
                playHitSound();
            }
            
            return false;
        }
        return true;
    });
    
    if (!hit) {
        // 未命中
        combo = 0;
        misses++;
        
        // 记录点击点（未命中）
        clickPoints.push({ x: mouseX, y: mouseY, hit: false, time: Date.now() });
    }
    
    // 更新准确率趋势
    updateAccuracyTrend();
    
    // 更新HUD
    updateHUD();
}

// 创建粒子效果
function createParticles(x, y, color) {
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const speed = 2 + Math.random() * 3;
        
        particles.push({
            x,
            y,
            radius: 2 + Math.random() * 3,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            opacity: 1,
            decay: 0.02
        });
    }
}

// 更新粒子
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity -= particle.decay;
        
        return particle.opacity > 0;
    });
}

// 播放命中音效
function playHitSound() {
    // 简单的音效实现
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// 更新准确率趋势
function updateAccuracyTrend() {
    const accuracy = totalClicks > 0 ? (hits / totalClicks) * 100 : 100;
    accuracyTrend.push(accuracy);
    
    // 只保留最近60个数据点
    if (accuracyTrend.length > 60) {
        accuracyTrend.shift();
    }
}

// 更新HUD
function updateHUD() {
    const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
    
    scoreElement.textContent = score;
    comboElement.textContent = combo;
    accuracyElement.textContent = `${accuracy}%`;
    hitsElement.textContent = hits;
}

// 结束游戏
function endGame() {
    gameState = GameState.ENDED;
    
    // 计算最终数据
    const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 0;
    const avgReactionTime = reactionTimes.length > 0 ? 
        Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length) : 0;
    const avgOffset = offsetDistances.length > 0 ?
        Math.round(offsetDistances.reduce((sum, dist) => sum + dist, 0) / offsetDistances.length) : 0;
    
    // 更新结算界面
    finalHitsElement.textContent = hits;
    finalAccuracyElement.textContent = `${accuracy}%`;
    finalAvgTimeElement.textContent = `${avgReactionTime}ms`;
    finalOffsetElement.textContent = `${avgOffset}px`;
    
    // 绘制鼠标轨迹
    drawTrajectory();
    
    // 显示结算弹窗
    resultModal.classList.remove('hidden');
}

// 绘制鼠标轨迹
function drawTrajectory() {
    const trajectoryCanvas = document.getElementById('trajectoryCanvas');
    const trajCtx = trajectoryCanvas.getContext('2d');
    
    // 清空画布
    trajCtx.clearRect(0, 0, trajectoryCanvas.width, trajectoryCanvas.height);
    
    if (mouseTrail.length < 2) return;
    
    // 缩放轨迹到画布大小
    const minX = Math.min(...mouseTrail.map(p => p.x));
    const maxX = Math.max(...mouseTrail.map(p => p.x));
    const minY = Math.min(...mouseTrail.map(p => p.y));
    const maxY = Math.max(...mouseTrail.map(p => p.y));
    
    const scaleX = trajectoryCanvas.width / (maxX - minX || 1);
    const scaleY = trajectoryCanvas.height / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY) * 0.8;
    
    const offsetX = (trajectoryCanvas.width - (maxX - minX) * scale) / 2;
    const offsetY = (trajectoryCanvas.height - (maxY - minY) * scale) / 2;
    
    // 绘制轨迹线（缩小）
    trajCtx.beginPath();
    trajCtx.strokeStyle = '#666666';
    trajCtx.lineWidth = 1; // 缩小轨迹线
    
    mouseTrail.forEach((point, index) => {
        const x = (point.x - minX) * scale + offsetX;
        const y = (point.y - minY) * scale + offsetY;
        
        if (index === 0) {
            trajCtx.moveTo(x, y);
        } else {
            trajCtx.lineTo(x, y);
        }
    });
    
    trajCtx.stroke();
    
    // 绘制点击点
    clickPoints.forEach(point => {
        const x = (point.x - minX) * scale + offsetX;
        const y = (point.y - minY) * scale + offsetY;
        
        if (point.hit) {
            // 命中：绿色圆圈
            trajCtx.beginPath();
            trajCtx.arc(x, y, 3, 0, Math.PI * 2);
            trajCtx.fillStyle = '#00FF00';
            trajCtx.fill();
        } else {
            // 未命中：红色叉号
            trajCtx.strokeStyle = '#FF0000';
            trajCtx.lineWidth = 1.5;
            trajCtx.beginPath();
            trajCtx.moveTo(x - 3, y - 3);
            trajCtx.lineTo(x + 3, y + 3);
            trajCtx.moveTo(x + 3, y - 3);
            trajCtx.lineTo(x - 3, y + 3);
            trajCtx.stroke();
        }
    });
    
    // 绘制起点
    if (mouseTrail.length > 0) {
        const startPoint = mouseTrail[0];
        const x = (startPoint.x - minX) * scale + offsetX;
        const y = (startPoint.y - minY) * scale + offsetY;
        
        trajCtx.beginPath();
        trajCtx.arc(x, y, 2, 0, Math.PI * 2);
        trajCtx.fillStyle = '#00FF00';
        trajCtx.fill();
    }
    
    // 绘制终点
    if (mouseTrail.length > 0) {
        const endPoint = mouseTrail[mouseTrail.length - 1];
        const x = (endPoint.x - minX) * scale + offsetX;
        const y = (endPoint.y - minY) * scale + offsetY;
        
        trajCtx.beginPath();
        trajCtx.arc(x, y, 2, 0, Math.PI * 2);
        trajCtx.fillStyle = '#FF0000';
        trajCtx.fill();
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', init);