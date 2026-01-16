import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { PlayerScore } from '../../hooks/useGameSync';

interface Props {
    eventId: string;
}

export const LiveLeaderboard = ({ eventId }: Props) => {
    const [players, setPlayers] = useState<PlayerScore[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, `events/${eventId}/players`),
            orderBy('score', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setPlayers(snapshot.docs.map(d => d.data() as PlayerScore));
        });

        return () => unsub();
    }, [eventId]);

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase">Live Leaderboard</h3>
                <span className="text-xs font-bold text-slate-400">{players.length} Players</span>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Rank</th>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {players.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-3 pl-6 font-mono font-bold text-slate-400 w-16">#{idx + 1}</td>
                                <td className="p-3 font-bold text-slate-700">{p.name || `Player ${p.id}`}</td>
                                <td className="p-3 font-mono text-xs text-slate-400">P{p.id}</td>
                                <td className="p-3 pr-6 text-right font-black text-xl text-blue-600 font-mono">
                                    {p.score}
                                </td>
                            </tr>
                        ))}
                        {players.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                                    Waiting for players to join...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
