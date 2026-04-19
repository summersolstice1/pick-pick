/* ============================================================
   TrainGun - 灵敏度计算引擎
   ============================================================ */

/**
 * 支持的游戏列表及其换算系数
 *
 * 核心公式： cm/360 = (2.54 × 360) / (DPI × sens × gameCoeff)
 * 网页换算： webSens = (DPI × sens × gameCoeff) / baseFactor
 *
 * 其中 baseFactor 将 cm/360 映射到屏幕像素移动
 */
const GAMES = [
    {
        id: 'cs2',
        name: 'CS2 / CS:GO',
        icon: '🔫',
        coefficient: 0.022,
        defaultSens: 2.0,
        sensRange: { min: 0.1, max: 10, step: 0.01 },
        description: 'Counter-Strike 2'
    },
    {
        id: 'valorant',
        name: 'Valorant',
        icon: '🎯',
        coefficient: 0.07,
        defaultSens: 0.6,
        sensRange: { min: 0.01, max: 5, step: 0.01 },
        description: 'Riot Valorant'
    },
    {
        id: 'apex',
        name: 'Apex Legends',
        icon: '🦅',
        coefficient: 0.022,
        defaultSens: 2.0,
        sensRange: { min: 0.1, max: 10, step: 0.1 },
        description: 'Apex Legends'
    },
    {
        id: 'overwatch',
        name: 'Overwatch 2',
        icon: '🛡️',
        coefficient: 0.0066,
        defaultSens: 6.0,
        sensRange: { min: 0.1, max: 100, step: 0.1 },
        description: 'Overwatch 2'
    },
    {
        id: 'fortnite',
        name: 'Fortnite',
        icon: '🏗️',
        coefficient: 0.5555,
        defaultSens: 0.06,
        sensRange: { min: 0.01, max: 1, step: 0.01 },
        description: 'Fortnite'
    },
    {
        id: 'r6siege',
        name: 'Rainbow Six Siege',
        icon: '🛑',
        coefficient: 0.00572958,
        defaultSens: 10,
        sensRange: { min: 1, max: 100, step: 1 },
        description: 'Rainbow Six Siege'
    }
];

/**
 * 常用 DPI 预设
 */
const DPI_PRESETS = [400, 800, 1000, 1200, 1600, 3200];

/**
 * 计算 cm/360（鼠标水平移动多少厘米转一圈360度）
 * @param {string} gameId - 游戏 ID
 * @param {number} sensitivity - 游戏内灵敏度
 * @param {number} dpi - 鼠标 DPI
 * @returns {number} cm/360 值
 */
function calculateCm360(gameId, sensitivity, dpi) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) {
        console.warn(`[Sensitivity] Unknown game: ${gameId}`);
        return 30;
    }

    const cm360 = (2.54 * 360) / (dpi * sensitivity * game.coefficient);
    return Math.round(cm360 * 100) / 100;
}

/**
 * 根据 cm/360 计算网页灵敏度系数
 * @param {number} cm360 - cm/360 值
 * @param {number} dpi - 鼠标 DPI
 * @returns {number} 网页灵敏度系数
 */
function calculateWebSensitivity(cm360, dpi) {
    const canvasWidth = window.innerWidth || 1920;
    const fov = 103;
    const fullRotationPixels = canvasWidth * (360 / fov);
    const mouseCountsPerRotation = (cm360 / 2.54) * dpi;
    const webSens = fullRotationPixels / mouseCountsPerRotation;

    return Math.round(webSens * 10000) / 10000;
}

/**
 * 一步到位：从游戏灵敏度直接计算网页灵敏度
 * @param {string} gameId - 游戏 ID
 * @param {number} sensitivity - 游戏内灵敏度
 * @param {number} dpi - 鼠标 DPI
 * @returns {{ cm360: number, webSensitivity: number }}
 */
function calculateFromGame(gameId, sensitivity, dpi) {
    const cm360 = calculateCm360(gameId, sensitivity, dpi);
    const webSensitivity = calculateWebSensitivity(cm360, dpi);
    return { cm360, webSensitivity };
}

/**
 * 获取默认灵敏度配置
 * @returns {Object}
 */
function getDefaultConfig() {
    return {
        game: 'cs2',
        sensitivity: 2.0,
        dpi: 800,
        cm360: calculateCm360('cs2', 2.0, 800),
        webSensitivity: calculateWebSensitivity(
            calculateCm360('cs2', 2.0, 800),
            800
        )
    };
}

// 暴露到全局
window.Sensitivity = {
    GAMES,
    DPI_PRESETS,
    calculateCm360,
    calculateWebSensitivity,
    calculateFromGame,
    getDefaultConfig
};