class ReflexMode {
    constructor(engine) {
        this.engine = engine;
        this.lastTargetSpawn = 0;
        this.spawnTimer = 0;
        this.expiredCount = 0;
        this.config = {
            easy: {
                radius: 40,
                lifespan: 2.2,
                interval: 1.35,
                duration: 45
            },
            normal: {
                radius: 32,
                lifespan: 1.35,
                interval: 1,
                duration: 45
            },
            hard: {
                radius: 22,
                lifespan: 0.8,
                interval: 0.7,
                duration: 45
            },
            insane: {
                radius: 16,
                lifespan: 0.5,
                interval: 0.45,
                duration: 45
            }
        };
        this.currentConfig = this.config.normal;
    }
    
    init() {
        this.lastTargetSpawn = Date.now();
        this.spawnTimer = 0;
        this.expiredCount = 0;
        this.currentConfig = this.config[this.engine.difficulty] || this.config.normal;
        
        // 清空目标
        this.engine.targets = [];
    }
    
    update() {
        const now = Date.now();
        const dt = 0.016; // 假设60fps
        
        this.spawnTimer += dt;
        
        // 检查过期目标
        this.engine.targets.forEach(target => {
            target.lifespan -= dt;
            
            // 快消失时颜色变红，闪烁
            if (target.lifespan < 0.3) {
                target.color = '#ff3366';
            } else if (target.lifespan < 0.6) {
                target.color = '#ff6633';
            }
            
            if (target.lifespan <= 0 && !target.expired) {
                target.expired = true;
                this.expiredCount++;
                this.engine.shots++;
                this.engine.combo = 0;
                this.engine.score = Math.max(0, this.engine.score - 10);
                
                // 播放错误音效
                this.engine.audio.playError();
            }
        });
        
        // 移除过期目标
        this.engine.targets = this.engine.targets.filter(target => !target.expired);
        
        // 生成新目标
        const activeTargets = this.engine.targets.filter(target => !target.expired);
        if (this.spawnTimer >= this.currentConfig.interval && activeTargets.length === 0) {
            this.spawnTimer = 0;
            this.spawnTarget();
        }
        
        // 确保场上至少有一个目标
        if (this.engine.targets.length === 0) {
            this.spawnTarget();
        }
    }
    
    spawnTarget() {
        const canvas = this.engine.canvas;
        const margin = this.currentConfig.radius + 60;
        const x = margin + Math.random() * (canvas.width - margin * 2);
        const y = margin + Math.random() * (canvas.height - margin * 2);
        
        this.engine.targets.push({
            x: x,
            y: y,
            radius: this.currentConfig.radius,
            lifespan: this.currentConfig.lifespan,
            maxLifespan: this.currentConfig.lifespan,
            color: '#ffaa00',
            expired: false
        });
        
        // 播放目标出现音效
        this.engine.audio.playTargetAppear();
    }
    
    handleClick(clickPos) {
        let hit = false;
        
        for (let i = this.engine.targets.length - 1; i >= 0; i--) {
            const target = this.engine.targets[i];
            if (!target.expired) {
                const dx = clickPos.x - target.x;
                const dy = clickPos.y - target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= target.radius) {
                    // 计算反应时间
                    const reactionTime = (Date.now() - (Date.now() - target.lifespan * 1000));
                    
                    // 计算得分
                    let points = 100;
                    let bonusText = '';
                    
                    // 反应时间奖励
                    if (reactionTime < 150) {
                        points += 80;
                        bonusText = 'INSANE!';
                    } else if (reactionTime < 200) {
                        points += 50;
                        bonusText = 'FAST!';
                    }
                    
                    // 极限命中（在目标消失前 50ms 内）
                    if (target.lifespan <= 0.05) {
                        points += 30;
                        bonusText = 'CLUTCH!';
                    }
                    
                    this.engine.score += points;
                    this.engine.hits++;
                    this.engine.combo++;
                    
                    // 播放音效
                    this.engine.audio.playClick();
                    
                    // 创建粒子效果
                    this.engine.createParticles(target.x, target.y);
                    
                    // 标记为过期
                    target.expired = true;
                    hit = true;
                    break;
                }
            }
        }
        
        if (!hit) {
            this.engine.combo = 0;
            this.engine.audio.playError();
        }
        
        return hit;
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        this.engine.targets.forEach(target => {
            if (target.expired) return;
            
            const r = target.radius;
            const progress = target.lifespan / target.maxLifespan;
            
            ctx.save();
            
            // 外圈 - 缩小的计时圈
            ctx.beginPath();
            ctx.arc(target.x, target.y, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.strokeStyle = target.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = target.color;
            ctx.stroke();
            
            // 目标本身
            ctx.shadowBlur = 15;
            ctx.shadowColor = target.color;
            ctx.beginPath();
            ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = target.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 内填充
            ctx.beginPath();
            ctx.arc(target.x, target.y, r * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = target.color + '30';
            ctx.fill();
            
            // 中心
            ctx.beginPath();
            ctx.arc(target.x, target.y, r * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            ctx.restore();
        });
    }
}
