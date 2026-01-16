import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { SerialService } from '../services/SerialService';
import { AudioService } from '../services/AudioService';
import readXlsxFile from 'read-excel-file'

interface PlayerState {
    id: number;
    name: string;
    score: number;
    isActive: boolean;
}

interface GameState {
    players: PlayerState[];
    teams: PlayerState[][]; // Array of groups (each group has 4 players)
    currentGroupIndex: number;

    timer: number; // Seconds
    milliseconds: number; // 0-999 milliseconds
    timerDuration: number;
    eventTitle: string;
    isPlaying: boolean;
    isPrepared: boolean; // "Yellow" state
    gameMode: string;
    isCountingDown: boolean; // Countdown audio playing
    connectionStatus: string;
    difficulty: number; // Software filter (Default 10)
    forceThreshold: number; // Hardware sensitivity (Default 100)
    autoSwitch: boolean;
}

type Action =
    | { type: 'SET_SCORE'; playerId: number; score: number }
    | { type: 'INCREMENT_SCORE'; playerId: number }
    | { type: 'SET_CONNECTION'; status: string }
    | { type: 'PREPARE_GAME' }
    | { type: 'START_GAME' } // Used for "Play" (Triangle)
    | { type: 'STOP_GAME' }
    | { type: 'TICK_TIMER' }
    | { type: 'SET_PLAYER_NAME'; playerId: number; name: string }
    | { type: 'SET_DIFFICULTY'; value: number }
    | { type: 'SET_FORCE_THRESHOLD'; value: number }
    | { type: 'SET_TIMER_DURATION'; value: number }
    | { type: 'IMPORT_TEAMS'; teams: PlayerState[][] }
    | { type: 'NEXT_GROUP' }
    | { type: 'PREV_GROUP' }
    | { type: 'SELECT_GROUP'; index: number }
    | { type: 'TOGGLE_AUTO_SWITCH' }
    | { type: 'SET_EVENT_TITLE'; title: string }
    | { type: 'TEST_HIT' };

const createEmptyTeam = (): PlayerState[] => [
    { id: 1, name: 'Enter Name', score: 0, isActive: true },
    { id: 2, name: 'Enter Name', score: 0, isActive: true },
    { id: 3, name: 'Enter Name', score: 0, isActive: true },
    { id: 4, name: 'Enter Name', score: 0, isActive: true },
];

const initialState: GameState = {
    players: createEmptyTeam(),
    teams: [createEmptyTeam()],
    currentGroupIndex: 0,
    timer: 10,
    milliseconds: 0,
    timerDuration: 10,
    eventTitle: 'Kicklab Speed Kicking',
    isPlaying: false,
    isPrepared: false,
    gameMode: 'Standard', // Placeholder if needed
    isCountingDown: false,
    connectionStatus: 'Disconnected',
    difficulty: 10,
    forceThreshold: 100,
    autoSwitch: false
};

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'INCREMENT_SCORE':
            return {
                ...state,
                players: state.players.map(p =>
                    p.id === action.playerId ? { ...p, score: p.score + 1 } : p
                )
            };
        case 'SET_CONNECTION':
            return { ...state, connectionStatus: action.status };
        case 'PREPARE_GAME':
            // Reset scores, stop timer, ready to start (NO countdown yet)
            return {
                ...state,
                isPrepared: true,
                isPlaying: false,
                isCountingDown: false,
                timer: state.timerDuration,
                milliseconds: 0,
                players: state.players.map(p => ({ ...p, score: 0 }))
            };
        case 'START_GAME':
            // If not playing and prepared, trigger countdown
            if (!state.isPlaying && state.isPrepared && !state.isCountingDown) {
                console.log('START_GAME: Triggering countdown');
                return { ...state, isCountingDown: true };
            }
            // If countdown is active or just finished, start the actual game
            console.log('START_GAME: Starting game, setting isPlaying=true');
            // Start BGM when game starts
            AudioService.getInstance().playBGM();
            return { ...state, isPlaying: true, isPrepared: true, isCountingDown: false };
        case 'STOP_GAME':
            console.log('STOP_GAME: Stopping game');
            // Stop BGM when game stops
            AudioService.getInstance().stopBGM();
            return { ...state, isPlaying: false, isCountingDown: false };
        case 'TICK_TIMER':
            // Decrement by 50ms (matching original app)
            let newMs = state.milliseconds - 50;
            let newTimer = state.timer;

            if (newMs < 0) {
                newMs = 950; // Reset to 950ms
                newTimer = state.timer - 1;
            }

            if (newTimer < 0) {
                // Timer finished
                return { ...state, timer: 0, milliseconds: 0, isPlaying: false };
            }
            return { ...state, timer: newTimer, milliseconds: newMs };
        case 'SET_PLAYER_NAME':
            // Update current players AND the team registry
            const newPlayers = state.players.map(p => p.id === action.playerId ? { ...p, name: action.name } : p);
            const newTeams = [...state.teams];
            newTeams[state.currentGroupIndex] = newPlayers;
            return {
                ...state,
                players: newPlayers,
                teams: newTeams
            };
        case 'SET_DIFFICULTY':
            return { ...state, difficulty: action.value };
        case 'SET_FORCE_THRESHOLD':
            return { ...state, forceThreshold: action.value };
        case 'SET_TIMER_DURATION':
            return { ...state, timerDuration: action.value, timer: action.value };
        case 'IMPORT_TEAMS':
            if (action.teams.length === 0) return state;
            return {
                ...state,
                teams: action.teams,
                currentGroupIndex: 0,
                players: action.teams[0],
                timer: state.timerDuration,
                isPlaying: false
            };
        case 'NEXT_GROUP':
            if (state.currentGroupIndex < state.teams.length - 1) {
                const nextIdx = state.currentGroupIndex + 1;
                return {
                    ...state,
                    currentGroupIndex: nextIdx,
                    players: state.teams[nextIdx],
                    timer: state.timerDuration,
                    isPlaying: false,
                    isPrepared: false
                };
            }
            return state;
        case 'PREV_GROUP':
            if (state.currentGroupIndex > 0) {
                const prevIdx = state.currentGroupIndex - 1;
                return {
                    ...state,
                    currentGroupIndex: prevIdx,
                    players: state.teams[prevIdx],
                    timer: state.timerDuration,
                    isPlaying: false,
                    isPrepared: false
                };
            }
            return state;
        case 'SELECT_GROUP':
            if (action.index >= 0 && action.index < state.teams.length) {
                return {
                    ...state,
                    currentGroupIndex: action.index,
                    players: state.teams[action.index],
                    timer: state.timerDuration,
                    isPlaying: false,
                    isPrepared: false
                }
            }
            return state;
        case 'TOGGLE_AUTO_SWITCH':
            return { ...state, autoSwitch: !state.autoSwitch };
        case 'SET_EVENT_TITLE':
            return { ...state, eventTitle: action.title };
        case 'TEST_HIT':
            // Simulate random hits
            const randomId = Math.floor(Math.random() * 4) + 1;
            return {
                ...state,
                players: state.players.map(p => p.id === randomId ? { ...p, score: p.score + 1 } : p)
            }
        default:
            return state;
    }
};

const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<Action>;
    importTeams: (file: File) => Promise<void>;
    updateThresholdHardware: (val: number) => void;
} | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        const serial = SerialService.getInstance();

        const unsubscribe = serial.subscribe((event) => {
            if (event.type === 'status') {
                dispatch({ type: 'SET_CONNECTION', status: event.payload });
            } else if (event.type === 'data') {
                if (!state.isPlaying) return;

                const packet = event.payload;
                // Threshold check is done in hardware usually? Or software?
                // Logic from GLS.cs: Checks if (val > threshold * 20)
                // Note: Packet sends VAL/20. So we compare packetVal vs Threshold directly?
                // Legacy: if ((int)byteTemp[3] * 256 + (int)byteTemp[4] > Convert.ToInt32(this.comboBox3.Text) * 20)

                // Software Difficulty Check (from GLS.cs logic)
                const softwareThreshold = state.difficulty * 20;

                const p1Val = (packet[3] << 8) | packet[4];
                if (p1Val > softwareThreshold && (packet[12] & 1) === 1) dispatch({ type: 'INCREMENT_SCORE', playerId: 1 });

                const p2Val = (packet[5] << 8) | packet[6];
                if (p2Val > softwareThreshold && (packet[12] & 2) === 2) dispatch({ type: 'INCREMENT_SCORE', playerId: 2 });

                const p3Val = (packet[7] << 8) | packet[8];
                if (p3Val > softwareThreshold && (packet[12] & 4) === 4) dispatch({ type: 'INCREMENT_SCORE', playerId: 3 });

                const p4Val = (packet[9] << 8) | packet[10];
                if (p4Val > softwareThreshold && (packet[12] & 8) === 8) dispatch({ type: 'INCREMENT_SCORE', playerId: 4 });
            }
        });

        return () => { unsubscribe(); };
    }, [state.isPlaying, state.difficulty]);

    // Countdown audio effect
    useEffect(() => {
        if (state.isCountingDown) {
            const audio = AudioService.getInstance();

            audio.playCountdown(() => {
                // Auto-start game after countdown
                console.log('Countdown complete, starting game...');
                dispatch({ type: 'START_GAME' });
            }).catch(err => {
                console.error('Countdown error:', err);
                // Start game anyway if countdown fails
                dispatch({ type: 'START_GAME' });
            });
        }
    }, [state.isCountingDown]);

    // Timer effect - 50ms intervals (matching original app)
    useEffect(() => {
        console.log('Timer effect triggered:', { isPlaying: state.isPlaying, timer: state.timer, milliseconds: state.milliseconds });
        let interval: number;
        if (state.isPlaying && (state.timer > 0 || state.milliseconds > 0)) {
            console.log('Starting timer interval...');
            interval = setInterval(() => {
                dispatch({ type: 'TICK_TIMER' });
            }, 50); // 50ms intervals
        } else if (state.timer === 0 && state.milliseconds === 0 && state.isPlaying) {
            console.log('Game Over - Timer reached zero');
            // Game Over
            if (state.autoSwitch) {
                dispatch({ type: 'NEXT_GROUP' });
            }
            dispatch({ type: 'STOP_GAME' });
        }
        return () => clearInterval(interval);
    }, [state.isPlaying, state.timer, state.milliseconds, state.autoSwitch]);

    const importTeams = async (file: File) => {
        try {
            const rows = await readXlsxFile(file);
            // Expect format: Header Row, then data
            // Col 0: Name1, Col 1: Name2, Col 2: Name3, Col 3: Name4
            // Check header?
            const teams: PlayerState[][] = [];
            // Skip header if matches "选手1" etc
            let startRow = 0;
            if (rows[0] && rows[0][0] === '选手1') startRow = 1;

            for (let i = startRow; i < rows.length; i++) {
                const row = rows[i];
                teams.push([
                    { id: 1, name: String(row[0] || 'Player 1'), score: 0, isActive: true },
                    { id: 2, name: String(row[1] || 'Player 2'), score: 0, isActive: true },
                    { id: 3, name: String(row[2] || 'Player 3'), score: 0, isActive: true },
                    { id: 4, name: String(row[3] || 'Player 4'), score: 0, isActive: true },
                ]);
            }
            if (teams.length > 0) {
                dispatch({ type: 'IMPORT_TEAMS', teams });
            }
        } catch (e) {
            console.error("Import failed", e);
            alert("Import failed: " + e); // Simple feedback
        }
    };

    const updateThresholdHardware = (val: number) => {
        // Send packet: [0xAA, 0xBB, 0x00, 0x34, 0x00, 0x02, 0x00, VAL, 0x00, 0x00]
        const packet = new Uint8Array([0xAA, 0xBB, 0x00, 0x34, 0x00, 0x02, 0x00, val, 0x00, 0x00]);
        SerialService.getInstance().write(packet);
        dispatch({ type: 'SET_FORCE_THRESHOLD', value: val });
    };

    return (
        <GameContext.Provider value={{ state, dispatch, importTeams, updateThresholdHardware }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within GameProvider');
    return context;
};
