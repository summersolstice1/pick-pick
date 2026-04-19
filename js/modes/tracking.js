class TrackingMode {
    constructor(engine) {
        this.engine = engine;
        this.lastTargetSpawn = 0;
        this.trackingFrames = 0;
        this.trackingHitFrames = 0;
    }
    
    init() {
        this.lastTargetSpawn = Date.now();
        this.trackingFrames = 0;
        this.trackingHitFrames = 0;
        
        // 清空目标
        this.engine.targets = [];
        
        // 生成一个追踪目标
        this.spawnTarget();
    }
    
    update() {
        const now = Date.now();
        const dt = 0.016; // 假设60fps
        
        // 更新目标
        this.engine.targets.forEach(target => {
            // 更新时间
            target.time += dt * target.speed;
            
            // 正弦运动 + 噪声
            const nx = Math.sin(target.time * target.freqX + target.phaseX) * target.ampX
                + Math.sin(target.time * target.noiseFreqX) * target.noiseAmpX;
            const ny = Math.sin(target.time * target.freqY + target.phaseY) * target.ampY
                + Math.cos(target.time * target.noiseFreqY) * target.noiseAmpY;
            
            target.x = target.baseX + nx;
            target.y = target.baseY + ny;
            
            // 边界限制
            const margin = target.radius + 20;
            target.x = Math.max(margin, Math.min(this.engine.canvas.width - margin, target.x));
            target.y = Math.max(margin, Math.min(this.engine.canvas.height - margin, target.y));
            
            // 检测准星是否在目标上
            this.trackingFrames++;
            
            const isOnTarget = this.isHit(this.engine.mousePos, target);
            target.isTracked = isOnTarget;
            
            if (isOnTarget) {
                this.trackingHitFrames++;
                target.trackedTime += dt;
                
                // 基础分 +1/帧
                this.engine.score += 1;
                
                // 连续追踪奖励（超过1秒后每帧额外+0.5）
                if (target.trackedTime > 1) {
                    this.engine.score += 1;
                    this.engine.combo = Math.floor(target.trackedTime);
                }
            } else {
                target.trackedTime = 0;
                this.engine.combo = 0;
            }
        });
        
        // 确保场上至少有一个目标
        if (this.engine.targets.length === 0) {
            this.spawnTarget();
        }
    }
    
    spawnTarget() {
        const canvas = this.engine.canvas;
        const radius = this.engine.getTargetSize();
        const speed = this.engine.getTargetSpeed();
        
        // 中心位置
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 创建追踪目标
        const target = {
            x: centerX,
            y: centerY,
            baseX: centerX,
            baseY: centerY,
            radius: radius,
            speed: speed * 0.1, // 调整速度
            time: Math.random() * 100,
            isTracked: false,
            trackedTime: 0,
            
            // 运动参数
            freqX: 0.5 + Math.random() * 1.5,
            freqY: 0.3 + Math.random() * 1.2,
            ampX: canvas.width * 0.15 + Math.random() * canvas.width * 0.15,
            ampY: canvas.height * 0.15 + Math.random() * canvas.height * 0.15,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            
            // 二级噪声
            noiseFreqX: 2 + Math.random() * 3,
            noiseFreqY: 2.5 + Math.random() * 3,
            noiseAmpX: 20 + Math.random() * 30,
            noiseAmpY: 20 + Math.random() * 30
        };
        
        this.engine.targets.push(target);
        
        // 播放目标出现音效
        this.engine.audio.playTargetAppear();
    }
    
    isHit(clickPos, target) {
        const dx = clickPos.x - target.x;
        const dy = clickPos.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= target.radius;
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        this.engine.targets.forEach(target => {
            const r = target.radius;
            const targetColor = target.isTracked ? '#00ff88' : '#ff6666';
            const glow = target.isTracked ? 20 : 10;
            
            ctx.save();
            
            // 外圈发光
            ctx.shadowBlur = glow;
            ctx.shadowColor = targetColor;
            
            // 拖尾效果
            if (target.isTracked) {
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.arc(target.x, target.y, r * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#00ff88';
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // 外圈
            ctx.beginPath();
            ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = targetColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // 内圈
            ctx.beginPath();
            ctx.arc(target.x, target.y, r * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = targetColor + '30';
            ctx.fill();
            
            // 中心
            ctx.beginPath();
            ctx.arc(target.x, target.y, r * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            // 追踪进度环（左下角弧线显示连续追踪时间）
            if (target.isTracked && target.trackedTime > 0) {
                const progress = Math.min(target.trackedTime / 2, 1); // 2秒满
                ctx.beginPath();
                ctx.arc(target.x, target.y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
                ctx.strokeStyle = '#00fff0';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }
}