import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { KickEvent } from '../../services/EventService';
import { Play, Square, RotateCcw, Save } from 'lucide-react';

interface Props {
    event: KickEvent;
}

export const LiveGameControl = ({ event }: Props) => {
    const [duration, setDuration] = useState(event.settings.timerDuration || 60);
    const [loading, setLoading] = useState(false);

    const updateStatus = async (status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED', resetTimer = false) => {
        setLoading(true);
        try {
            const updates: any = { status };
            if (status === 'ACTIVE') {
                updates.startedAt = serverTimestamp();
            }
            if (resetTimer) {
                updates.startedAt = null;
            }

            await updateDoc(doc(db, 'events', event.id), updates);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'events', event.id), {
                'settings.timerDuration': duration
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${event.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                Live Control
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Timer (Sec)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            className="w-full border-2 border-slate-300 rounded p-2 font-mono font-bold"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                        />
                        <button
                            onClick={saveSettings}
                            disabled={loading || duration === event.settings.timerDuration}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current State</label>
                    <div className="font-black text-2xl text-slate-800">{event.status}</div>
                </div>
            </div>

            <div className="flex gap-2">
                {event.status !== 'ACTIVE' ? (
                    <button
                        onClick={() => updateStatus('ACTIVE')}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all"
                    >
                        <Play className="w-6 h-6 fill-current" /> START
                    </button>
                ) : (
                    <button
                        onClick={() => updateStatus('COMPLETED')}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all"
                    >
                        <Square className="w-6 h-6 fill-current" /> STOP
                    </button>
                )}

                <button
                    onClick={() => updateStatus('SCHEDULED', true)}
                    disabled={loading}
                    className="aspect-square bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center border-2 border-slate-200 hover:border-slate-300"
                    title="Reset Status"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
