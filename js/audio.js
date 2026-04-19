class AudioManager {
    constructor() {
        this.audioContext = null;
        this.soundSetting = 'global';
        this.storage = new StorageManager();
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }

        const settings = this.storage.getSettings();
        this.soundSetting = settings.soundEnabled || 'global';
    }

    enable() {
        this.soundSetting = this.storage.getSettings().soundEnabled || 'global';
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('Web Audio API not supported:', error);
            }
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    disable() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    shouldPlay() {
        if (!this.audioContext) return false;
        if (this.soundSetting === 'off') return false;
        if (this.soundSetting === 'global') return true;
        return window.gameEngine && window.gameEngine.gameState === 'playing';
    }

    createTone(startFrequency, endFrequency, duration, gain = 0.1) {
        if (!this.shouldPlay()) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(startFrequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playClick() {
        this.createTone(800, 400, 0.1, 0.1);
    }

    playTargetAppear() {
        this.createTone(400, 800, 0.05, 0.05);
    }

    playGameStart() {
        this.createTone(200, 800, 0.3, 0.1);
    }

    playGameEnd() {
        this.createTone(800, 200, 0.5, 0.1);
    }

    playCombo(comboCount) {
        const frequency = 400 + comboCount * 20;
        this.createTone(frequency, frequency * 1.3, 0.12, 0.08);
    }

    playError() {
        this.createTone(700, 180, 0.2, 0.08);
    }
}
