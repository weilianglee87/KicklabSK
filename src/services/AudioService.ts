// Audio service for countdown and game sounds
import countdownAudio from '../assets/Ready321go.mp3';
import bgmAudio from '../assets/bgm.mp3';

export class AudioService {
    private static instance: AudioService;
    private audioContext: AudioContext | null = null;
    private countdownAudioElement: HTMLAudioElement | null = null;
    private bgmAudioElement: HTMLAudioElement | null = null;

    private constructor() {
        // Initialize audio elements
        this.countdownAudioElement = new Audio(countdownAudio);
        this.bgmAudioElement = new Audio(bgmAudio);
        this.bgmAudioElement.loop = true;
        this.bgmAudioElement.volume = 0.3;
    }

    static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    // Play countdown audio from MP3 file
    async playCountdown(onComplete?: () => void): Promise<void> {
        return new Promise((resolve) => {
            if (!this.countdownAudioElement) {
                if (onComplete) onComplete();
                resolve();
                return;
            }

            this.countdownAudioElement.currentTime = 0;
            this.countdownAudioElement.volume = 1.0;

            this.countdownAudioElement.onended = () => {
                if (onComplete) onComplete();
                resolve();
            };

            this.countdownAudioElement.play().catch(e => {
                console.error('Countdown play failed:', e);
                if (onComplete) onComplete();
                resolve();
            });
        });
    }

    // Play background music
    playBGM() {
        if (this.bgmAudioElement) {
            this.bgmAudioElement.currentTime = 0;
            this.bgmAudioElement.play().catch(e => console.log('BGM play failed:', e));
        }
    }

    stopBGM() {
        if (this.bgmAudioElement) {
            this.bgmAudioElement.pause();
            this.bgmAudioElement.currentTime = 0;
        }
    }

    // Play success sound effect
    playSuccessSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    // Play hit sound effect
    playHitSound() {
        this.initAudioContext();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    cleanup() {
        this.stopBGM();
        if (this.countdownAudioElement) {
            this.countdownAudioElement.pause();
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
