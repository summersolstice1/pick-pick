class SwitchingMode {
    constructor(engine) {
        this.engine = engine;
        this.currentTargetIndex = 0;
        this.targets = [];
        this.batchCleared = 0;
        this.lastHitTime = 0;
        this.config = {
            easy: {
                radius: 35,
                count: 2,
                moving: false,
                duration: 60
            },
            medium: {
                radius: 25,
                count: 3,
                moving: false,
                duration: 60
            },
            hard: {
                radius: 18,
                count: 5,
                moving: true,
                duration: 60
            }
        };
        this.currentConfig = this.config.medium;
    }
    
    init() {
        this.currentTargetIndex = 0;
        this.targets = [];
        this.batchCleared = 0;
        this.lastHitTime = performance.now();
        this.currentConfig = this.config[this.engine.difficulty] || this.config.medium;
        
        // 生成第一批目标
        this.spawnBatch();
    }
    
    spawnBatch() {
        const targets = [];
        const margin = this.currentConfig.radius + 80;
        const minDist = this.currentConfig.radius * 4; // 最小间距
        
        for (let i = 0; i < this.currentConfig.count; i++) {
            let x, y, attempts = 0;
            do {
                x = margin + Math.random() * (this.engine.canvas.width - margin * 2);
                y = margin + Math.random() * (this.engine.canvas.height - margin * 2);
                attempts++;
            } while (
                attempts < 50 &&
                targets.some(t => {
                    const dx = t.x - x;
                    const dy = t.y - y;
                    return Math.sqrt(dx * dx + dy * dy) < minDist;
                })
            );
            
            const target = {
                x: x,
                y: y,
                radius: this.currentConfig.radius,
                moving: this.currentConfig.moving,
                vx: this.currentConfig.moving ? (Math.random() - 0.5) * 60 : 0,
                vy: this.currentConfig.moving ? (Math.random() - 0.5) * 60 : 0,
                color: '#ff6b35',
                active: true
            };
            
            targets.push(target);
        }
        
        this.targets.push(...targets);
    }
    
    update() {
        // 更新移动目标
        this.targets.forEach(target => {
            if (target.moving && target.active) {
                target.x += target.vx * 0.016; // 假设60fps
                target.y += target.vy * 0.016;
                
                const margin = target.radius + 20;
                if (target.x < margin || target.x > this.engine.canvas.width - margin) target.vx *= -1;
                if (target.y < margin || target.y > this.engine.canvas.height - margin) target.vy *= -1;
                
                target.x = Math.max(margin, Math.min(this.engine.canvas.width - margin, target.x));
                target.y = Math.max(margin, Math.min(this.engine.canvas.height - margin, target.y));
            }
        });
        
        // 如果所有目标被清除，刷新新一批
        const activeTargets = this.targets.filter(target => target.active);
        if (activeTargets.length === 0) {
            this.batchCleared++;
            // 全清奖励
            this.engine.score += 200;
            
            // 播放音效
            this.engine.audio.playCombo(this.engine.combo);
            
            // 生成新一批目标
            this.targets = [];
            this.spawnBatch();
        }
    }
    
    handleClick(clickPos) {
        let hit = false;
        
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            if (target.active) {
                const dx = clickPos.x - target.x;
                const dy = clickPos.y - target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= target.radius) {
                    // 计算切换速度
                    const now = performance.now();
                    const switchTime = now - this.lastHitTime;
                    this.lastHitTime = now;
                    
                    // 计算得分
                    let points = 100;
                    
                    // 切换速度奖励
                    if (switchTime < 200) {
                        points += 80;
                    } else if (switchTime < 300) {
                        points += 50;
                    } else if (switchTime < 500) {
                        points += 20;
                    }
                    
                    this.engine.score += points;
                    this.engine.hits++;
                    this.engine.combo++;
                    
                    // 播放音效
                    this.engine.audio.playClick();
                    
                    // 创建粒子效果
                    this.engine.createParticles(target.x, target.y);
                    
                    // 标记为非活动
                    target.active = false;
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
        
        this.targets.forEach(target => {
            if (!target.active) return;
            
            // 绘制目标
            ctx.fillStyle = target.color;
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制目标外圈
            ctx.strokeStyle = '#00FFCC';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制移动轨迹
            if (target.moving) {
                ctx.strokeStyle = `rgba(255, 107, 53, 0.5)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(target.x - target.vx * 0.1, target.y - target.vy * 0.1);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            }
        });
    }
}