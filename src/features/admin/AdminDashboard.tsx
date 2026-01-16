import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/AuthStore';
import { eventService } from '../../services/EventService';
import type { KickEvent } from '../../services/EventService';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Calendar, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { LiveGameControl } from './LiveGameControl';
import { LiveLeaderboard } from './LiveLeaderboard';

export const AdminDashboard = () => {
    const { user } = useAuthStore();
    const [events, setEvents] = useState<KickEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<KickEvent | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    // Listen to Events created by this user
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'events'),
            where('createdBy', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KickEvent));
            setEvents(evs);
        });

        return () => unsubscribe();
    }, [user]);

    // Listen to Selected Event Updates (Real-time status changes in Monitor view)
    useEffect(() => {
        if (!selectedEvent) return;

        const unsub = onSnapshot(doc(db, 'events', selectedEvent.id), (doc) => {
            if (doc.exists()) {
                setSelectedEvent({ id: doc.id, ...doc.data() } as KickEvent);
            }
        });
        return () => unsub();
    }, [selectedEvent?.id]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newEventTitle) return;

        setCreating(true);
        try {
            await eventService.createEvent(newEventTitle, user.uid);
            setShowCreate(false);
            setNewEventTitle('');
        } catch (err) {
            console.error(err);
            alert("Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = () => {
        auth.signOut();
        navigate('/login/admin');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
                <h1 className="text-2xl font-black text-blue-500 mb-8 tracking-tighter">KICKLAB MANAGER</h1>

                <div className="space-y-2 flex-1">
                    <button
                        onClick={() => setSelectedEvent(null)}
                        className={`w-full flex items-center gap-3 p-3 rounded font-bold transition-all ${!selectedEvent ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'text-gray-400 hover:bg-slate-800'}`}
                    >
                        <Calendar className="w-5 h-5" />
                        My Events
                    </button>
                    {/* Placeholder for future global monitor */}
                </div>

                <div className="pt-6 border-t border-slate-700">
                    <div className="text-xs text-slate-500 mb-2 font-bold uppercase">Logged in as</div>
                    <div className="text-sm truncate font-medium text-slate-300 mb-4">{user?.email}</div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                {!selectedEvent ? (
                    // EVENT LIST VIEW
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">My Events</h2>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Create Event
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-10">
                            {events.map(ev => (
                                <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:border-blue-300 transition-colors group cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Code</div>
                                        <div className="text-4xl font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                                            {ev.code}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-2 pr-20">{ev.title}</h3>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                        <span className={`flex items-center gap-1 font-bold ${ev.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${ev.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {ev.status}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(ev.createdAt?.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <button className="w-full py-2 border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                        Open Dashboard
                                    </button>
                                </div>
                            ))}

                            {events.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <div className="mb-4">No events found.</div>
                                    <button onClick={() => setShowCreate(true)} className="text-blue-600 font-bold hover:underline">Create your first event</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // LIVE MONITOR VIEW
                    <div className="flex flex-col h-full gap-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
                                    <span className="text-slate-400 font-medium text-lg">Event:</span>
                                    {selectedEvent.title}
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-sm font-mono border border-slate-300 text-slate-500">
                                        CODE: {selectedEvent.code}
                                    </span>
                                </h2>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-500 font-bold hover:text-blue-600">
                                Close Monitor
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                            <div className="lg:col-span-1">
                                <LiveGameControl event={selectedEvent} />
                            </div>
                            <div className="lg:col-span-2 h-full">
                                <LiveLeaderboard eventId={selectedEvent.id} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Create New Event</h3>
                        <form onSubmit={handleCreate}>
                            <div className="mb-6">
                                <label className="block text-slate-600 font-bold mb-2">Event Title</label>
                                <input
                                    autoFocus
                                    className="w-full border-2 border-slate-300 rounded-lg p-3 text-lg font-bold focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. National Championship 2026"
                                    value={newEventTitle}
                                    onChange={e => setNewEventTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
