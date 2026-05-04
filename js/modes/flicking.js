class FlickingMode {
    constructor(engine) {
        this.engine = engine;
        this.lastTargetSpawn = 0;
    }
    
    init() {
        this.lastTargetSpawn = Date.now();
    }
    
    update() {
        const now = Date.now();
        const spawnRate = this.engine.getTargetSpawnRate();
        
        if (now - this.lastTargetSpawn > spawnRate) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }
        
        // 移除过期目标
        this.engine.targets = this.engine.targets.filter(target => 
            now - target.spawnTime < 3200
        );
        
        // 确保场上至少有一个目标
        if (this.engine.targets.length === 0) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }
    }
    
    spawnTarget() {
        const canvas = this.engine.canvas;
        const radius = this.engine.getTargetSize();
        
        // 随机位置，确保目标完全在画布内
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        
        this.engine.targets.push({
            x: x,
            y: y,
            radius: radius,
            spawnTime: Date.now(),
            color: '#FF0055'
        });
        
        // 播放目标出现音效
        this.engine.audio.playTargetAppear();
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        this.engine.targets.forEach(target => {
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
            
            // 绘制脉冲效果
            const age = Date.now() - target.spawnTime;
            const pulse = Math.sin(age / 100) * 3;
            ctx.strokeStyle = `rgba(0, 255, 204, ${1 - age / 3200})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius + 8 + pulse, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
}
