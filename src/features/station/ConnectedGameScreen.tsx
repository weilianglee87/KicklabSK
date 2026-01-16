import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/AuthStore';
import { useGameSync } from '../../hooks/useGameSync';
import { SerialService } from '../../services/SerialService';
import { InputEngine } from '../../services/InputEngine';
import { useNavigate } from 'react-router-dom';

// Reuse detailed visual components from Legacy
import bgImage from '../../assets/background.jpg';
import dialImage from '../../assets/quick_king_score.png';
import p1Char from '../../assets/player_1.png';
import p2Char from '../../assets/player_2.png';
import p3Char from '../../assets/player_3.png';
import p4Char from '../../assets/player_4.png';

const CHARACTERS = [p1Char, p2Char, p3Char, p4Char]; // Need 8 for full cluster eventually

const PLAYER_POSITIONS = [
    { charX: 125, charY: 351, scoreDialX: 125, scoreDialY: 210, nameX: 142, nameY: 573 },
    { charX: 403, charY: 351, scoreDialX: 403, scoreDialY: 210, nameX: 420, nameY: 573 },
    { charX: 682, charY: 351, scoreDialX: 682, scoreDialY: 210, nameX: 700, nameY: 572 },
    { charX: 960, charY: 351, scoreDialX: 953, scoreDialY: 210, nameX: 971, nameY: 572 }
];

export const ConnectedGameScreen = () => {
    const { eventId, stationId } = useAuthStore();
    const { event, players, updateScore } = useGameSync(eventId);
    const navigate = useNavigate();
    const engine = InputEngine.getInstance();

    // Local State
    const [timeLeft, setTimeLeft] = useState(0);
    const [serialStatus, setSerialStatus] = useState('Disconnected');

    // Station Config (MVP: Station A=0, Station B=4)
    // TODO: move to persistent config
    const stationOffset = 0;

    // Redirect if no event
    useEffect(() => {
        if (!eventId) navigate('/station');
    }, [eventId, navigate]);

    // Timer Sync Logic
    useEffect(() => {
        if (event?.status === 'ACTIVE' && event.startedAt) {
            const interval = setInterval(() => {
                const now = Date.now();
                const start = event.startedAt.toMillis();
                const duration = (event.settings?.timerDuration || 60) * 1000;
                const elapsed = now - start;
                const remaining = Math.max(0, duration - elapsed);
                setTimeLeft(remaining);
            }, 50);
            return () => clearInterval(interval);
        } else {
            setTimeLeft((event?.settings?.timerDuration || 60) * 1000);
        }
    }, [event]);

    // Hardware Input Listener
    useEffect(() => {
        const unsub = engine.subscribe((pid) => {
            // pid is 1-4 from hardware
            const realPid = pid + stationOffset;
            // Here we could implement optimisitic UI update if we wanted
            updateScore(realPid, 1);
        });

        // Listen to serial status for UI
        const serialUnsub = SerialService.getInstance().subscribe((evt) => {
            if (evt.type === 'status') setSerialStatus(evt.payload as string);
        });

        // Allow Keyboard Mock for testing
        const mockListener = (e: KeyboardEvent) => {
            if (e.key === '1') updateScore(1 + stationOffset, 1);
            if (e.key === '2') updateScore(2 + stationOffset, 1);
        };
        window.addEventListener('keydown', mockListener);

        return () => {
            unsub();
            serialUnsub();
            window.removeEventListener('keydown', mockListener);
        };
    }, [stationOffset, updateScore]);

    if (!event) return <div className="text-white">Loading Event...</div>;

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const cs = Math.floor((ms % 1000) / 10);
        return `${s.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative w-[1264px] h-[682px] overflow-hidden bg-gray-900 mx-auto">
            {/* BG */}
            <div className="absolute inset-0 z-0 bg-cover" style={{ backgroundImage: `url(${bgImage})` }} />

            {/* Header */}
            <div className="absolute top-4 w-full text-center z-10">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-white uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                    {event.title}
                </h1>
            </div>

            {/* Timer */}
            <div className="absolute top-24 w-full flex justify-center z-10">
                <div className="bg-gradient-to-b from-orange-600 to-red-700 px-8 py-2 rounded-2xl border-4 border-red-900 shadow-2xl">
                    <span className="text-5xl font-mono text-white font-black tracking-widest">
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Players Area */}
            {PLAYER_POSITIONS.map((pos, idx) => {
                const playerId = idx + 1 + stationOffset;
                const player = players.find(p => p.id === playerId) || { score: 0, name: `P${playerId}` };

                return (
                    <div key={idx}>
                        {/* Score Dial */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={{ left: pos.scoreDialX, top: pos.scoreDialY, width: 172, height: 141 }}
                        >
                            <div className="w-32 h-32 bg-contain bg-no-repeat bg-center flex items-center justify-center transform -translate-y-1" style={{ backgroundImage: `url(${dialImage})` }}>
                                <span className="text-[#d82a2a] font-black text-4xl pt-4 pr-1 tracking-tighter">
                                    {player.score.toString().padStart(3, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Character */}
                        <div className="absolute" style={{ left: pos.charX, top: pos.charY, width: 172, height: 202 }}>
                            <img src={CHARACTERS[idx % 4]} className="w-full h-full object-contain drop-shadow-xl" />
                        </div>

                        {/* Name */}
                        <div className="absolute text-center" style={{ left: pos.nameX, top: pos.nameY, width: 139 }}>
                            <div className="bg-white/90 px-2 py-0.5 rounded font-bold text-xs ring-1 ring-blue-400">
                                {player.name}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Status Footer */}
            <div className="absolute bottom-2 left-2 text-white text-xs font-mono opacity-50 flex items-center gap-4 z-50">
                <span>STATION: {stationId} | EVENT: {event.code}</span>
                <button
                    onClick={() => SerialService.getInstance().requestPort()}
                    className={`px-2 py-0.5 border rounded transition-colors ${serialStatus === 'Connected' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 hover:bg-white/10'}`}
                >
                    HW: {serialStatus}
                </button>
            </div>
        </div>
    );
};
