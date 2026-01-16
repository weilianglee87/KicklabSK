type SerialEventCallback = (data: { type: 'data'; payload: number[] } | { type: 'status'; payload: string }) => void;

export class SerialService {
    private static instance: SerialService;
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private isReading = false;
    private callbacks: Set<SerialEventCallback> = new Set();

    // CH340 VID is 0x1A86. This filters the list to only show relevant devices.
    private static readonly CH340_FILTER = [{ usbVendorId: 0x1A86 }];

    private constructor() { }

    public static getInstance(): SerialService {
        if (!SerialService.instance) {
            SerialService.instance = new SerialService();
        }
        return SerialService.instance;
    }

    public subscribe(callback: SerialEventCallback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    private emit(event: { type: 'data'; payload: number[] } | { type: 'status'; payload: string }) {
        this.callbacks.forEach(cb => cb(event));
    }

    public async requestPort() {
        if (!navigator.serial) return;

        try {
            // Request port with filter for CH340
            const port = await navigator.serial.requestPort({ filters: SerialService.CH340_FILTER });
            await this.connect(port);
        } catch (error) {
            console.log('User cancelled selection or error:', error);
            this.emit({ type: 'status', payload: 'Error selecting port' });
        }
    }

    private async connect(port: SerialPort) {
        this.port = port;
        try {
            await this.port.open({ baudRate: 115200 }); // Encoding was GBK, but baud needs verification. Defaulting to 9600 based on common hardware.
            this.emit({ type: 'status', payload: 'Connected' });
            this.readLoop();
        } catch (error) {
            console.error('Failed to open port:', error);
            this.emit({ type: 'status', payload: 'Connection failed' });
        }
    }

    private async readLoop() {
        if (!this.port?.readable) return;
        this.reader = this.port.readable.getReader();
        this.isReading = true;

        // Buffer for assembling packets
        let buffer: number[] = [];
        const PacketSize = 28;
        const Header = [0xAA, 0xBB, 0x01];

        try {
            while (this.isReading) {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value) {
                    // Append new bytes
                    buffer.push(...Array.from(value));

                    // Process buffer for packets
                    while (buffer.length >= PacketSize) {
                        // Scan for Header
                        const headerIndex = buffer.findIndex((_, i) =>
                            buffer[i] === Header[0] &&
                            buffer[i + 1] === Header[1] &&
                            buffer[i + 2] === Header[2]
                        );

                        if (headerIndex === -1) {
                            // No header found, keep last few bytes in case header is split
                            buffer = buffer.slice(-2);
                            break;
                        }

                        if (headerIndex > 0) {
                            // Discard bytes before header
                            buffer = buffer.slice(headerIndex);
                        }

                        if (buffer.length >= PacketSize) {
                            // Extract Packet
                            const packet = buffer.slice(0, PacketSize);
                            buffer = buffer.slice(PacketSize);

                            // Emit valid packet
                            // Protocol check: array[11] == 2 is another check from GLS.cs
                            if (packet[11] === 0x02) {
                                this.emit({ type: 'data', payload: packet });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Read error:', error);
        } finally {
            this.reader?.releaseLock();
        }
    }

    public async write(data: Uint8Array) {
        if (!this.port || !this.port.writable) return;
        const writer = this.port.writable.getWriter();
        try {
            await writer.write(data);
        } catch (e) {
            console.error('Write error:', e);
        } finally {
            writer.releaseLock();
        }
    }

    public async disconnect() {
        this.isReading = false;
        if (this.reader) {
            await this.reader.cancel();
        }
        if (this.port) {
            await this.port.close();
        }
        this.port = null;
        this.emit({ type: 'status', payload: 'Disconnected' });
    }
}
