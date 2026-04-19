class SixTargetMode {
    constructor(engine) {
        this.engine = engine;
        this.targets = [];
        this.currentTargetIndex = 0;
        this.sequence = [];
    }
    
    init() {
        this.targets = [];
        this.currentTargetIndex = 0;
        this.sequence = this.generateSequence();
        this.spawnTargets();
    }
    
    generateSequence() {
        const sequence = [0, 1, 2, 3, 4, 5];
        // 洗牌算法
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }
        return sequence;
    }
    
    spawnTargets() {
        const canvas = this.engine.canvas;
        const radius = this.engine.getTargetSize();
        
        // 六边形布局
        for (let i = 0; i < 6; i++) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = (Math.PI * 2 / 6) * i;
            const distance = Math.min(canvas.width, canvas.height) * 0.3;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            this.targets.push({
                x: x,
                y: y,
                radius: radius,
                index: i,
                color: i === this.sequence[0] ? '#FF0055' : '#333333'
            });
        }
    }
    
    update() {
        // 目标颜色更新
        this.targets.forEach((target, index) => {
            target.color = index === this.sequence[this.currentTargetIndex] ? '#FF0055' : '#333333';
        });
    }
    
    handleClick(clickPos) {
        const targetIndex = this.sequence[this.currentTargetIndex];
        const target = this.targets[targetIndex];
        const dx = clickPos.x - target.x;
        const dy = clickPos.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= target.radius) {
            // 点击正确目标
            this.engine.score += 15;
            this.engine.hits++;
            this.engine.combo++;
            
            // 播放音效
            this.engine.audio.playClick();
            
            // 创建粒子效果
            this.engine.createParticles(target.x, target.y);
            
            // 切换到下一个目标
            this.currentTargetIndex++;
            
            // 完成一轮
            if (this.currentTargetIndex >= this.sequence.length) {
                this.sequence = this.generateSequence();
                this.currentTargetIndex = 0;
                // 播放连击音效
                this.engine.audio.playCombo(this.engine.combo);
            }
            
            return true;
        } else {
            // 点击错误目标
            this.engine.combo = 0;
            this.engine.audio.playError();
            return false;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        this.targets.forEach(target => {
            // 绘制目标
            ctx.fillStyle = target.color;
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制目标序号
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((this.sequence.indexOf(target.index) + 1).toString(), target.x, target.y);
            
            // 绘制目标外圈
            if (target.index === this.sequence[this.currentTargetIndex]) {
                ctx.strokeStyle = '#00FFCC';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }
}