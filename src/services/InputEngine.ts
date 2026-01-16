import { SerialService } from './SerialService';

type KickCallback = (playerId: number, force: number) => void;

export class InputEngine {
    private static instance: InputEngine;
    private serial: SerialService;
    private callbacks: Set<KickCallback> = new Set();

    // Config
    private debounceMs = 80;
    private difficulty = 10; // 10 * 20 = 200 threshold

    // State
    private lastKickTime: Map<number, number> = new Map();

    private constructor() {
        this.serial = SerialService.getInstance();
        this.serial.subscribe(this.handleSerialPacket.bind(this));

        // Init times
        for (let i = 1; i <= 4; i++) this.lastKickTime.set(i, 0);
    }

    public static getInstance(): InputEngine {
        if (!InputEngine.instance) {
            InputEngine.instance = new InputEngine();
        }
        return InputEngine.instance;
    }

    public subscribe(cb: KickCallback) {
        this.callbacks.add(cb);
        return () => this.callbacks.delete(cb);
    }

    public setConfig(difficulty: number, debounceMs: number) {
        this.difficulty = difficulty;
        this.debounceMs = debounceMs;
    }

    private handleSerialPacket(event: { type: string, payload: any }) {
        if (event.type !== 'data') return;

        const packet = event.payload as number[]; // buffer array
        if (!packet || packet.length < 28) return;

        // Threshold Calculation
        const threshold = this.difficulty * 20;
        const now = Date.now();

        // Check Player 1
        this.checkPlayer(1, packet[3], packet[4], packet[12], 1, threshold, now);
        // Check Player 2
        this.checkPlayer(2, packet[5], packet[6], packet[12], 2, threshold, now);
        // Check Player 3
        this.checkPlayer(3, packet[7], packet[8], packet[12], 4, threshold, now);
        // Check Player 4
        this.checkPlayer(4, packet[9], packet[10], packet[12], 8, threshold, now);
    }

    private checkPlayer(
        id: number,
        highByte: number,
        lowByte: number,
        flagByte: number,
        mask: number,
        threshold: number,
        now: number
    ) {
        const force = (highByte << 8) | lowByte;
        const isTriggered = (flagByte & mask) === mask;

        if (isTriggered && force > threshold) {
            const last = this.lastKickTime.get(id) || 0;
            if (now - last > this.debounceMs) {
                // Valid Kick
                this.lastKickTime.set(id, now);
                this.emitKick(id, force);
            }
        }
    }

    private emitKick(id: number, force: number) {
        this.callbacks.forEach(cb => cb(id, force));
    }
}
