class DpiTestMode {
    constructor(engine) {
        this.engine = engine;
        this.clickSamples = [];
        this.currentTarget = null;
    }

    init() {
        this.clickSamples = [];
        this.currentTarget = null;
        this.engine.targets = [];
        this.spawnTarget();
    }

    update() {
        if (!this.engine.targets.length) {
            this.spawnTarget();
        }
    }

    spawnTarget() {
        const canvas = this.engine.canvas;
        const baseRadius = this.engine.getTargetSize();
        const difficultyFactor = {
            easy: [1.25, 2.1],
            normal: [1, 1.8],
            hard: [0.8, 1.5],
            insane: [0.65, 1.2]
        };
        const [minFactor, maxFactor] = difficultyFactor[this.engine.difficulty] || [1, 1.8];
        const radius = Math.round(baseRadius * (minFactor + Math.random() * (maxFactor - minFactor)));
        const margin = radius + 20;
        const x = Math.random() * (canvas.width - margin * 2) + margin;
        const y = Math.random() * (canvas.height - margin * 2) + margin;

        this.currentTarget = {
            x,
            y,
            radius,
            spawnTime: Date.now(),
            pulseSeed: Math.random() * Math.PI * 2
        };

        this.engine.targets = [this.currentTarget];
        this.engine.audio.playTargetAppear();
    }

    handleClick(clickPos) {
        const target = this.currentTarget || this.engine.targets[0];
        if (!target) {
            return false;
        }

        const reactionTime = Date.now() - target.spawnTime;
        const dx = clickPos.x - target.x;
        const dy = clickPos.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const success = distance <= target.radius;
        const normalizedDistance = Number((distance / target.radius).toFixed(3));

        this.clickSamples.push({
            reactionTime,
            distance,
            normalizedDistance,
            success
        });

        if (success) {
            this.engine.handleTargetHit(target, 0);
            const centerBonus = Math.max(0, Math.round((1 - normalizedDistance) * 12));
            const speedBonus = Math.max(0, Math.round(14 - reactionTime / 90));
            this.engine.score += centerBonus + speedBonus;
        }

        this.currentTarget = null;
        this.spawnTarget();
        return success;
    }

    render() {
        const ctx = this.engine.ctx;
        const target = this.currentTarget || this.engine.targets[0];
        if (!target) {
            return;
        }

        const age = (Date.now() - target.spawnTime) / 1000;
        const pulse = Math.sin(age * 4 + target.pulseSeed) * 4;

        ctx.save();

        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 16 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(47, 128, 237, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 77, 109, 0.32)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 24;
        ctx.shadowColor = 'rgba(255, 77, 109, 0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(target.x, target.y, Math.max(3, target.radius * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = '#ff4d6d';
        ctx.shadowBlur = 0;
        ctx.fill();

        ctx.restore();
    }

    getAverageReactionTime() {
        if (!this.clickSamples.length) {
            return 0;
        }

        const total = this.clickSamples.reduce((sum, sample) => sum + sample.reactionTime, 0);
        return Math.round(total / this.clickSamples.length);
    }

    getResultSummary(metrics) {
        const settings = this.engine.storage.getSensitivityConfig();
        const currentDpi = settings?.dpi || 800;
        const avgReactionTime = metrics.avgReactionTime || this.getAverageReactionTime();
        const accuracy = metrics.accuracy || 0;
        const lowerDpi = Math.max(200, Math.round(currentDpi * 0.85 / 50) * 50);
        const higherDpi = Math.min(3200, Math.round(currentDpi * 1.15 / 50) * 50);
        const speedIndex = avgReactionTime > 0 ? Math.max(0, Math.min(100, Math.round(100 - (avgReactionTime - 280) / 7))) : 0;
        const balanceIndex = Math.max(0, 100 - Math.abs(speedIndex - accuracy));

        let body = `当前测试 DPI 为 ${currentDpi}，平均点击 ${avgReactionTime}ms，命中率 ${accuracy}%，平衡指数 ${balanceIndex}。`;

        if (accuracy >= 85 && avgReactionTime <= 720) {
            body += ` 这说明你当前 DPI 比较适合自己，速度和稳定性都在线，建议先以 ${currentDpi} 作为主力档位。`;
        } else if (accuracy < 72 && avgReactionTime <= 650) {
            body += ` 你的速度不错，但偏容易过冲，建议下一轮改测更低一点的 DPI，例如 ${lowerDpi}。`;
        } else if (accuracy >= 85 && avgReactionTime > 820) {
            body += ` 你的控制很稳，但启动偏慢，建议试试略高一点的 DPI，例如 ${higherDpi}，看看能否提升启动速度。`;
        } else {
            body += ` 当前结果偏中性，建议围绕 ${currentDpi} 上下各测一档，和 ${lowerDpi} / ${higherDpi} 做对比后再确定长期使用值。`;
        }

        return {
            title: 'DPI 倾向分析',
            body
        };
    }
}
