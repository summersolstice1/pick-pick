const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, 'app-data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const DEFAULT_SETTINGS = {
    hudEnabled: true,
    mouseTrailEnabled: 'global',
    particlesEnabled: true,
    soundEnabled: 'global',
    cursorType: 'default',
    cursorSize: 20,
    cursorColor: '#ff4d6d',
    cursorEnabled: 'global'
};

const DEFAULT_SENSITIVITY_CONFIG = {
    game: 'cs2',
    sensitivity: 2,
    dpi: 800,
    cm360: 26,
    webSensitivity: 1
};

const DEFAULT_ACHIEVEMENTS = {
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

const DEFAULT_STATS = {
    totalGames: 0,
    totalHits: 0,
    totalShots: 0,
    totalScore: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestReactionTime: null,
    games: []
};

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2), 'utf8');
    }
}

function readDatabase() {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        return parsed && Array.isArray(parsed.users) ? parsed : { users: [] };
    } catch (error) {
        console.error('数据文件解析失败，已重置为空数据库。', error);
        return { users: [] };
    }
}

function writeDatabase(database) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2), 'utf8');
}

function normalizeSettings(settings = {}) {
    return {
        ...deepClone(DEFAULT_SETTINGS),
        ...(settings || {})
    };
}

function normalizeSensitivityConfig(config = {}) {
    return {
        ...deepClone(DEFAULT_SENSITIVITY_CONFIG),
        ...(config || {})
    };
}

function normalizeAchievements(achievements = {}) {
    return {
        ...deepClone(DEFAULT_ACHIEVEMENTS),
        ...(achievements || {})
    };
}

function normalizeStats(stats = {}) {
    const games = Array.isArray(stats.games) ? stats.games.slice(-100) : [];
    const normalizedGames = games.map((game) => ({
        mode: String(game.mode || 'flicking'),
        score: Number(game.score || 0),
        accuracy: Number(game.accuracy || 0),
        hits: Number(game.hits || 0),
        shots: Number(game.shots || 0),
        maxCombo: Number(game.maxCombo || 0),
        avgReactionTime: Number(game.avgReactionTime || 0),
        duration: Number(game.duration || 30),
        date: game.date || new Date().toISOString()
    }));

    const bestReactionTime =
        stats.bestReactionTime === null || stats.bestReactionTime === undefined
            ? null
            : Number(stats.bestReactionTime);

    return {
        ...deepClone(DEFAULT_STATS),
        ...stats,
        totalGames: Number(stats.totalGames || 0),
        totalHits: Number(stats.totalHits || 0),
        totalShots: Number(stats.totalShots || 0),
        totalScore: Number(stats.totalScore || 0),
        bestScore: Number(stats.bestScore || 0),
        bestAccuracy: Number(stats.bestAccuracy || 0),
        bestReactionTime: Number.isFinite(bestReactionTime) ? bestReactionTime : null,
        games: normalizedGames
    };
}

function createEmptyGameData() {
    return {
        stats: deepClone(DEFAULT_STATS),
        achievements: deepClone(DEFAULT_ACHIEVEMENTS),
        settings: deepClone(DEFAULT_SETTINGS),
        sensitivityConfig: deepClone(DEFAULT_SENSITIVITY_CONFIG),
        updatedAt: new Date().toISOString()
    };
}

function normalizeGameData(gameData = {}) {
    return {
        stats: normalizeStats(gameData.stats),
        achievements: normalizeAchievements(gameData.achievements),
        settings: normalizeSettings(gameData.settings),
        sensitivityConfig: normalizeSensitivityConfig(gameData.sensitivityConfig),
        updatedAt: gameData.updatedAt || new Date().toISOString()
    };
}

function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
    };
}

function createToken(user) {
    return jwt.sign(
        {
            sub: String(user.id),
            username: user.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function findUserById(database, userId) {
    return database.users.find((user) => String(user.id) === String(userId));
}

function findUserByUsername(database, username) {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    return database.users.find((user) => user.username.toLowerCase() === normalizedUsername);
}

function generateAvatarColor(seed) {
    const palette = ['#ff4d6d', '#ff7b54', '#6f61ff', '#2f80ed', '#14b8a6', '#f59e0b'];
    let hash = 0;
    for (const char of seed) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
}

function validateCredentials(username, password) {
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '');
    const usernamePattern = /^[\w\u4e00-\u9fa5-]{2,20}$/;

    if (!usernamePattern.test(cleanUsername)) {
        return '用户名需为 2-20 位，可包含中文、字母、数字、下划线和连字符';
    }

    if (cleanPassword.length < 6 || cleanPassword.length > 64) {
        return '密码长度需在 6-64 位之间';
    }

    return null;
}

function validatePassword(password) {
    const cleanPassword = String(password || '');
    if (cleanPassword.length < 6 || cleanPassword.length > 64) {
        return '密码长度需在 6-64 位之间';
    }
    return null;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: '请先登录' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.auth = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: '登录状态已失效，请重新登录' });
    }
}

function loadAuthenticatedUser(req, res) {
    const database = readDatabase();
    const user = findUserById(database, req.auth.sub);

    if (!user) {
        res.status(404).json({ error: '用户不存在' });
        return null;
    }

    if (!user.gameData) {
        user.gameData = createEmptyGameData();
        writeDatabase(database);
    } else {
        user.gameData = normalizeGameData(user.gameData);
    }

    return { database, user };
}

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, displayName } = req.body || {};
    const validationError = validateCredentials(username, password);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const database = readDatabase();
    if (findUserByUsername(database, username)) {
        return res.status(409).json({ error: '用户名已存在' });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    const cleanUsername = String(username).trim();
    const cleanDisplayName = String(displayName || cleanUsername).trim().slice(0, 24) || cleanUsername;

    const user = {
        id: database.users.reduce((maxId, current) => Math.max(maxId, current.id), 0) + 1,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatarColor: generateAvatarColor(cleanUsername),
        passwordHash,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        gameData: createEmptyGameData()
    };

    database.users.push(user);
    writeDatabase(database);

    res.status(201).json({
        token: createToken(user),
        user: sanitizeUser(user),
        gameData: user.gameData
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body || {};
    const database = readDatabase();
    const user = findUserByUsername(database, username);

    if (!user) {
        return res.status(400).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!isPasswordValid) {
        return res.status(400).json({ error: '用户名或密码错误' });
    }

    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = user.lastLoginAt;
    user.gameData = normalizeGameData(user.gameData);
    writeDatabase(database);

    res.json({
        token: createToken(user),
        user: sanitizeUser(user),
        gameData: user.gameData
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const result = loadAuthenticatedUser(req, res);
    if (!result) {
        return;
    }

    res.json({
        user: sanitizeUser(result.user)
    });
});

app.patch('/api/auth/profile', authenticateToken, (req, res) => {
    const result = loadAuthenticatedUser(req, res);
    if (!result) {
        return;
    }

    const { displayName } = req.body || {};
    const cleanDisplayName = String(displayName || '').trim().slice(0, 24);

    if (!cleanDisplayName) {
        return res.status(400).json({ error: '显示名称不能为空' });
    }

    result.user.displayName = cleanDisplayName;
    result.user.updatedAt = new Date().toISOString();
    writeDatabase(result.database);

    res.json({
        user: sanitizeUser(result.user)
    });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    const result = loadAuthenticatedUser(req, res);
    if (!result) {
        return;
    }

    const { oldPassword, newPassword } = req.body || {};
    const isPasswordValid = await bcrypt.compare(String(oldPassword || ''), result.user.passwordHash);

    if (!isPasswordValid) {
        return res.status(400).json({ error: '旧密码错误' });
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    result.user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    result.user.updatedAt = new Date().toISOString();
    writeDatabase(result.database);

    res.json({ message: '密码已更新' });
});

app.get('/api/game-data', authenticateToken, (req, res) => {
    const result = loadAuthenticatedUser(req, res);
    if (!result) {
        return;
    }

    res.json(result.user.gameData);
});

app.put('/api/game-data', authenticateToken, (req, res) => {
    const result = loadAuthenticatedUser(req, res);
    if (!result) {
        return;
    }

    const payload = req.body || {};
    const nextGameData = {
        ...result.user.gameData,
        updatedAt: new Date().toISOString()
    };

    if (payload.stats) {
        nextGameData.stats = normalizeStats(payload.stats);
    }

    if (payload.achievements) {
        nextGameData.achievements = normalizeAchievements(payload.achievements);
    }

    if (payload.settings) {
        nextGameData.settings = normalizeSettings(payload.settings);
    }

    if (payload.sensitivityConfig) {
        nextGameData.sensitivityConfig = normalizeSensitivityConfig(payload.sensitivityConfig);
    }

    result.user.gameData = nextGameData;
    result.user.updatedAt = nextGameData.updatedAt;
    writeDatabase(result.database);

    res.json(result.user.gameData);
});

app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }

    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

if (require.main === module) {
    ensureDataFile();
    app.listen(PORT, () => {
        console.log(`Summer Web 服务已启动: http://localhost:${PORT}`);
    });
}

module.exports = app;
