import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/AuthStore';
import { Monitor, Wifi } from 'lucide-react';
import { eventService } from '../../services/EventService';

export const StationJoin = () => {
    const [code, setCode] = useState('');
    const [stationName, setStationName] = useState('Station A');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const setStation = useAuthStore(state => state.setStation);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Validate Code First
            const event = await eventService.getEventByCode(code);
            if (!event) {
                throw new Error("Event not found. Check the code.");
            }

            // 2. Authenticate Anonymously
            await signInAnonymously(auth);

            // 3. Register Station in Firestore
            const stationId = await eventService.registerStation(event.id, stationName);

            // 4. Set Store
            setStation(stationId, event.id);

            // 5. Redirect
            navigate('/station/lobby');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to join.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex justify-center mb-6">
                    <div className="bg-emerald-600 p-4 rounded-full animate-pulse">
                        <Wifi className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white text-center mb-2">CONNECT STATION</h2>
                <p className="text-slate-400 text-center mb-8">Enter the Event Code found on the Admin Dashboard</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-slate-300 text-xs uppercase tracking-wider font-bold mb-2">Event Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 text-white border-2 border-slate-600 rounded-lg p-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-emerald-500 uppercase"
                            placeholder="0000"
                            maxLength={4}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-300 text-xs uppercase tracking-wider font-bold mb-2">Station Name</label>
                        <select
                            value={stationName}
                            onChange={(e) => setStationName(e.target.value)}
                            className="w-full bg-slate-700 text-white border border-slate-600 rounded p-3 focus:outline-none focus:border-emerald-500"
                        >
                            <option>Station A</option>
                            <option>Station B</option>
                            <option>Station C</option>
                            <option>Station D</option>
                            <option>Station E</option>
                            <option>Station F</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        <Monitor className="w-5 h-5" />
                        {loading ? 'CONNECTING...' : 'JOIN EVENT'}
                    </button>
                </form>
            </div>
        </div>
    );
};
