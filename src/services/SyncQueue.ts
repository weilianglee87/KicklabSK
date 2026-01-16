import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { db as firestoreDB } from '../lib/firebase';
import { doc, increment, setDoc } from 'firebase/firestore';

interface KickDB extends DBSchema {
    kicks: {
        key: number; // timestamp
        value: {
            eventId: string;
            playerId: number;
            points: number;
            timestamp: number;
        };
    };
}

export class SyncQueue {
    private static instance: SyncQueue;
    private dbPromise: Promise<IDBPDatabase<KickDB>>;
    private isSyncing = false;
    private online = navigator.onLine;

    private constructor() {
        this.dbPromise = openDB<KickDB>('kicklab-db', 1, {
            upgrade(db) {
                db.createObjectStore('kicks', { keyPath: 'timestamp' });
            },
        });

        window.addEventListener('online', () => {
            this.online = true;
            this.flush();
        });
        window.addEventListener('offline', () => {
            this.online = false;
        });

        // Initial Flush attempt
        if (this.online) this.flush();
    }

    public static getInstance() {
        if (!SyncQueue.instance) {
            SyncQueue.instance = new SyncQueue();
        }
        return SyncQueue.instance;
    }

    public async enqueue(eventId: string, playerId: number, points: number) {
        const kick = {
            eventId,
            playerId,
            points,
            timestamp: Date.now() + Math.random() // Unique key
        };

        const db = await this.dbPromise;
        await db.put('kicks', kick);

        if (this.online) {
            this.flush();
        }
    }

    private async flush() {
        if (this.isSyncing || !this.online) return;
        this.isSyncing = true;

        try {
            const db = await this.dbPromise;

            // 1. Get All Kicks
            const tx = db.transaction('kicks', 'readwrite');
            const store = tx.objectStore('kicks');
            const kicks = await store.getAll();

            if (kicks.length === 0) {
                this.isSyncing = false;
                return;
            }

            // 2. Aggregate by Player & Event
            const aggregations: Record<string, number> = {};
            const processedKeys: number[] = [];

            for (const k of kicks) {
                const key = `${k.eventId}_${k.playerId}`;
                aggregations[key] = (aggregations[key] || 0) + k.points;
                processedKeys.push(k.timestamp);
            }

            // 3. Write to Firestore
            // We use setDoc(..., {merge: true}) with increment
            const promises = Object.entries(aggregations).map(async ([key, points]) => {
                const [eventId, pIdStr] = key.split('_');
                const playerRef = doc(firestoreDB, `events/${eventId}/players/${pIdStr}`);
                await setDoc(playerRef, {
                    id: parseInt(pIdStr),
                    score: increment(points)
                }, { merge: true });
            });

            await Promise.all(promises);

            // 4. Delete processed items from IDB
            // New Transaction for deletion
            const delTx = db.transaction('kicks', 'readwrite');
            const delStore = delTx.objectStore('kicks');
            await Promise.all(processedKeys.map(key => delStore.delete(key)));
            await delTx.done;

        } catch (err) {
            console.error("Sync Logic Error:", err);
        } finally {
            this.isSyncing = false;
        }
    }
}
