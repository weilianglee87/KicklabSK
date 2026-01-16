import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import type { KickEvent } from '../services/EventService';
import { SyncQueue } from '../services/SyncQueue';

export interface PlayerScore {
    id: number; // 1-8
    name: string;
    score: number;
    stationId?: string;
}

export const useGameSync = (eventId: string | null) => {
    const [event, setEvent] = useState<KickEvent | null>(null);
    const [players, setPlayers] = useState<PlayerScore[]>([]);

    useEffect(() => {
        if (!eventId) return;

        // 1. Listen to Event State (Timer, Status)
        const eventUnsub = onSnapshot(doc(db, 'events', eventId), (doc) => {
            if (doc.exists()) {
                setEvent({ id: doc.id, ...doc.data() } as KickEvent);
            }
        });

        // 2. Listen to Players (Scores)
        const playersUnsub = onSnapshot(collection(db, `events/${eventId}/players`), (snapshot) => {
            const p: PlayerScore[] = [];
            snapshot.forEach(doc => {
                p.push(doc.data() as PlayerScore);
            });
            // Sort by ID
            p.sort((a, b) => a.id - b.id);
            setPlayers(p);
        });

        return () => {
            eventUnsub();
            playersUnsub();
        };
    }, [eventId]);

    const updateScore = async (playerId: number, points: number) => {
        if (!eventId) return;

        // Use Offline Sync Queue
        await SyncQueue.getInstance().enqueue(eventId, playerId, points);
    };

    return { event, players, updateScore };
};
