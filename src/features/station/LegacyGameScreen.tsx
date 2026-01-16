import React, { useRef, useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { SerialService } from '../../services/SerialService';

// Assets
import bgImage from '../../assets/background.jpg';
import dialImage from '../../assets/quick_king_score.png';

// Characters
import p1Char from '../../assets/player_1.png';
import p2Char from '../../assets/player_2.png';
import p3Char from '../../assets/player_3.png';
import p4Char from '../../assets/player_4.png';

const CHARACTERS = [p1Char, p2Char, p3Char, p4Char];

// Original app dimensions from GLS.Designer.cs
const APP_WIDTH = 1264;
const APP_HEIGHT = 682;

// Exact positions from decompiled code
const PLAYER_POSITIONS = [
    {
        charX: 125, charY: 351,
        scoreDialX: 125, scoreDialY: 210,
        checkboxX: 174, checkboxY: 556,
        nameX: 142, nameY: 573,
        stationY: 553
    },
    {
        charX: 403, charY: 351,
        scoreDialX: 403, scoreDialY: 210,
        checkboxX: 449, checkboxY: 556,
        nameX: 420, nameY: 573,
        stationY: 553
    },
    {
        charX: 682, charY: 351,
        scoreDialX: 682, scoreDialY: 210,
        checkboxX: 731, checkboxY: 556,
        nameX: 700, nameY: 572,
        stationY: 553
    },
    {
        charX: 960, charY: 351,
        scoreDialX: 953, scoreDialY: 210,
        checkboxX: 1003, checkboxY: 555,
        nameX: 971, nameY: 572,
        stationY: 553
    }
];

// Memoized PlayerStation to prevent re-renders on Timer ticks
const PlayerStation = React.memo(({ player, dispatch }: { player: any, dispatch: any }) => {
    const pos = PLAYER_POSITIONS[player.id - 1];
    const [isKicking, setIsKicking] = useState(false);
    const prevScoreRef = useRef(0);

    useEffect(() => {
        if (player.score > prevScoreRef.current) {
            setIsKicking(true);
            setTimeout(() => setIsKicking(false), 400);
        }
        prevScoreRef.current = player.score;
    }, [player.score]);

    return (
        <>
            <div
                className="absolute flex items-center justify-center"
                style={{
                    left: `${pos.scoreDialX}px`,
                    top: `${pos.scoreDialY}px`,
                    width: '172px',
                    height: '141px'
                }}
            >
                <div
                    className="w-32 h-32 bg-contain bg-no-repeat bg-center flex items-center justify-center transform translate-y-[-5px]"
                    style={{ backgroundImage: `url(${dialImage})` }}
                >
                    <span className="text-[#d82a2a] font-black text-4xl pt-4 pr-1 tracking-tighter">
                        {player.score.toString().padStart(3, '0')}
                    </span>
                </div>
            </div>

            <div
                className="absolute"
                style={{
                    left: `${pos.charX}px`,
                    top: `${pos.charY}px`,
                    width: '172px',
                    height: '202px'
                }}
            >
                <img
                    src={CHARACTERS[player.id - 1]}
                    alt={`Player ${player.id}`}
                    className={`w-full h-full object-contain filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] transition-transform duration-100 ${isKicking ? 'scale-110 -translate-y-2 brightness-110' : 'scale-100'
                        }`}
                />
            </div>

            <div
                className="absolute bg-blue-200/10 rounded-full blur-[1px]"
                style={{
                    left: `${pos.charX}px`,
                    top: `${pos.stationY + 10}px`,
                    width: '172px',
                    height: '30px'
                }}
            />

            <div className="absolute flex items-center gap-1" style={{ left: `${pos.checkboxX}px`, top: `${pos.checkboxY}px` }}>
                <input type="checkbox" defaultChecked className="w-3 h-3 text-blue-600 rounded cursor-pointer accent-blue-600" />
                <span className="text-gray-900 font-bold text-xs">Score Active</span>
            </div>

            <input
                className="absolute text-center font-bold text-gray-900 focus:outline-none py-0.5 px-2 bg-white/90 rounded border border-gray-400 shadow-sm placeholder-gray-500 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                style={{
                    left: `${pos.nameX}px`,
                    top: `${pos.nameY}px`,
                    width: '139px',
                    height: '26px',
                    fontSize: '12px'
                }}
                value={player.name}
                onChange={(e) => dispatch({ type: 'SET_PLAYER_NAME', playerId: player.id, name: e.target.value })}
                placeholder="Enter Name"
            />
        </>
    );
});

// Memoized Control Panel
const ControlPanel = React.memo(({ state, dispatch, importTeams, updateThresholdHardware, serial }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await importTeams(e.target.files[0]);
        }
    };

    const difficultyOptions = [];
    for (let i = 10; i < 410; i += 10) {
        difficultyOptions.push(i);
    }

    const btnStyle = "bg-white border border-gray-400 text-gray-800 font-bold rounded shadow-sm text-xs hover:bg-gray-100 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-300";

    return (
        <>
            <button onClick={() => dispatch({ type: 'PREV_GROUP' })} className={btnStyle} style={{ position: 'absolute', left: '15px', top: '615px', width: '75px', height: '23px' }}>Prev</button>
            <button onClick={() => dispatch({ type: 'NEXT_GROUP' })} className={btnStyle} style={{ position: 'absolute', left: '102px', top: '615px', width: '75px', height: '23px' }}>Next</button>
            <button className={btnStyle} style={{ position: 'absolute', left: '189px', top: '615px', width: '50px', height: '23px' }}>Select</button>

            <input
                className="absolute text-center border border-gray-400 rounded text-xs focus:outline-none focus:border-blue-500"
                style={{ left: '245px', top: '617px', width: '59px', height: '21px' }}
                value={state.currentGroupIndex + 1}
                onChange={(e) => dispatch({ type: 'SELECT_GROUP', index: parseInt(e.target.value) - 1 })}
            />
            <span className="absolute text-blue-500 text-xs font-bold" style={{ left: '313px', top: '620px' }}>Group</span>

            <div className="absolute bg-gray-100/80 rounded border border-gray-300 p-1 flex items-center" style={{ left: '370px', top: '609px', width: '203px', height: '41px' }}>
                <span className="text-xs text-gray-700 font-bold ml-1">Force: 30~255</span>
                <input
                    className="ml-2 w-10 text-center border border-gray-400 rounded text-xs py-0.5"
                    value={state.forceThreshold}
                    type="number"
                    onChange={(e) => dispatch({ type: 'SET_FORCE_THRESHOLD', value: parseInt(e.target.value) || 0 })}
                />
                <button
                    onClick={() => updateThresholdHardware(state.forceThreshold)}
                    className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 shadow-sm"
                >
                    Set
                </button>
            </div>

            <button className={btnStyle} style={{ position: 'absolute', left: '370px', top: '653px', width: '75px', height: '23px' }} onClick={() => serial.disconnect()}>Close Port</button>

            <button onClick={() => dispatch({ type: 'PREPARE_GAME' })} className="absolute rounded-full bg-gradient-to-b from-[#ffb300] to-[#ff8f00] border-4 border-[#8f6e0f] flex items-center justify-center shadow-xl hover:brightness-110 transition-all active:scale-95 group" style={{ left: '566px', top: '619px', width: '67px', height: '57px' }}>
                <div className="text-[#4e342e] font-black text-xs uppercase transform group-hover:scale-110 transition-transform">Ready</div>
            </button>

            <label className="absolute flex items-center gap-1 cursor-pointer select-none group" style={{ left: '648px', top: '660px' }}>
                <input type="checkbox" className="rounded text-blue-600 w-3 h-3 accent-blue-600" checked={state.autoSwitch} onChange={() => dispatch({ type: 'TOGGLE_AUTO_SWITCH' })} />
                <span className="text-[10px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Auto-Next Group</span>
            </label>

            <button
                onClick={() => {
                    if (state.isPlaying) {
                        dispatch({ type: 'STOP_GAME' });
                    } else {
                        dispatch({ type: 'START_GAME' });
                    }
                }}
                className={`absolute rounded-full flex items-center justify-center border-[5px] shadow-2xl transition-all hover:scale-105 active:scale-95 ${state.isPlaying ? 'bg-red-500 border-red-800 shadow-red-500/50' : 'bg-[#00c853] border-[#007f33] shadow-green-500/50'}`}
                style={{ left: '796px', top: '622px', width: '67px', height: '57px' }}
            >
                {state.isPlaying ? <div className="w-6 h-6 bg-white rounded shadow-sm"></div> : <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1.5"></div>}
            </button>

            <div className="absolute flex items-center gap-1" style={{ left: '900px', top: '651px' }}>
                <span className="text-xs text-blue-500 font-bold">Time:</span>
                <select className="bg-blue-500 text-white text-xs font-bold px-1 rounded border border-blue-600" style={{ width: '54px', height: '20px' }} value={state.timerDuration} onChange={(e) => dispatch({ type: 'SET_TIMER_DURATION', value: parseInt(e.target.value) })}>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-blue-500">s</span>
            </div>

            <div className="absolute flex items-center gap-1" style={{ left: '1015px', top: '650px' }}>
                <span className="text-xs text-blue-500 font-bold">Difficulty:</span>
                <select className="bg-blue-500 text-white text-xs font-bold px-1 rounded border border-blue-600" style={{ width: '65px', height: '20px' }} value={state.difficulty} onChange={(e) => dispatch({ type: 'SET_DIFFICULTY', value: parseInt(e.target.value) })}>
                    {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <button onClick={() => dispatch({ type: 'TEST_HIT' })} className={btnStyle} style={{ position: 'absolute', left: '1034px', top: '622px', width: '98px', height: '23px' }}>Test Hit</button>

            <button onClick={handleImportClick} className="absolute bg-gradient-to-b from-[#ffec99] to-[#ffd700] border-2 border-[#b8860b] text-[#5c4a18] font-bold rounded shadow-md text-xs hover:brightness-105 active:scale-95" style={{ left: '1147px', top: '622px', width: '92px', height: '23px' }}>Import Teams</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />

            <button className={btnStyle} style={{ position: 'absolute', left: '1147px', top: '647px', width: '92px', height: '23px' }}>Export</button>

            <div className="absolute flex items-center gap-2" style={{ left: '15px', top: '655px' }}>
                <span className="text-xs text-gray-700 font-bold">Port:</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${state.connectionStatus === 'Connected' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${state.connectionStatus === 'Connected' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></div>
                    <span className="font-bold">{state.connectionStatus}</span>
                </div>
                {state.connectionStatus !== 'Connected' && <button onClick={() => serial.requestPort()} className="text-xs font-bold text-blue-700 underline hover:text-blue-900">Scan</button>}
            </div>
        </>
    );
}, (prev, next) => {
    const p = prev.state;
    const n = next.state;
    return p.currentGroupIndex === n.currentGroupIndex && p.connectionStatus === n.connectionStatus && p.isPlaying === n.isPlaying && p.isPrepared === n.isPrepared && p.difficulty === n.difficulty && p.forceThreshold === n.forceThreshold && p.timerDuration === n.timerDuration && p.autoSwitch === n.autoSwitch;
});

export const LegacyGameScreen = () => {
    const { state, dispatch, importTeams, updateThresholdHardware } = useGame();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const serial = SerialService.getInstance();
    const [localTitle, setLocalTitle] = useState(state.eventTitle);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const formatTime = (seconds: number, milliseconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const cs = Math.floor(milliseconds / 10).toString().padStart(2, '0');
        return `${m}:${s}:${cs}`;
    };

    useEffect(() => {
        if (state.eventTitle !== localTitle && state.eventTitle !== 'Kicklab Speed Kicking') setLocalTitle(state.eventTitle);
    }, [state.eventTitle]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localTitle !== state.eventTitle) dispatch({ type: 'SET_EVENT_TITLE', title: localTitle });
        }, 300);
        return () => clearTimeout(handler);
    }, [localTitle, dispatch]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setLocalTitle(e.target.value);

    return (
        <div className="relative overflow-hidden bg-gray-900 shadow-2xl" style={{ width: `${APP_WIDTH}px`, height: `${APP_HEIGHT}px` }}>
            <button onClick={toggleFullscreen} className="absolute top-3 right-3 z-[60] bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all backdrop-blur-sm shadow-lg" title="Toggle Fullscreen">
                {isFullscreen ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
            </button>
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }} />
            <div className="relative z-10 w-full h-full">
                <div className="absolute flex justify-center items-center z-50" style={{ left: '110px', top: '15px', width: '1050px', height: '80px' }}>
                    <input
                        className="text-center font-bold text-white bg-gradient-to-b from-cyan-300 via-white to-cyan-200 bg-clip-text text-transparent uppercase tracking-wider px-6 py-2 focus:outline-none transition-all duration-200 w-full"
                        style={{ textShadow: '0 0 20px rgba(0,255,255,0.5), 0 0 40px rgba(0,255,255,0.3), 3px 3px 8px rgba(0,0,0,0.8)', fontFamily: 'Impact, "Arial Black", sans-serif', letterSpacing: '3px', fontSize: localTitle.length > 50 ? '2rem' : localTitle.length > 35 ? '2.5rem' : localTitle.length > 25 ? '3rem' : '3.5rem', WebkitTextStroke: '2px rgba(0,150,200,0.8)', filter: 'drop-shadow(0 4px 12px rgba(0,200,255,0.6))', background: 'transparent', border: 'none', animation: 'pulse 2s ease-in-out infinite' }}
                        value={localTitle}
                        onChange={handleTitleChange}
                        placeholder="Event Title"
                    />
                </div>
                <div className="absolute flex justify-center" style={{ left: '0px', top: '120px', width: '100%' }}>
                    <div className="bg-gradient-to-b from-[#e85d04] to-[#c32f27] px-10 py-2 rounded-2xl border-4 border-[#7c1919] shadow-2xl">
                        <span className="text-5xl font-mono text-white font-black tracking-widest drop-shadow-[3px_3px_0_rgba(0,0,0,0.5)]">{formatTime(state.timer, state.milliseconds)}</span>
                    </div>
                </div>
                {state.players.map((player: any) => <PlayerStation key={player.id} player={player} dispatch={dispatch} />)}
                <ControlPanel state={state} dispatch={dispatch} importTeams={importTeams} updateThresholdHardware={updateThresholdHardware} serial={serial} />
            </div>
        </div>
    );
};
