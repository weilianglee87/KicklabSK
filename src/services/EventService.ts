import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc } from 'firebase/firestore';

export interface KickEvent {
    id: string;
    title: string;
    code: string; // 4-digit join code
    createdBy: string;
    createdAt: any;
    startedAt?: any; // Firestore Timestamp
    status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
    settings: {
        timerDuration: number;
        difficulty: number;
    }
}

class EventService {
    private COLLECTION = 'events';

    /**
     * Generates a random 4-char code and checks for collisions.
     */
    private async generateUniqueCode(): Promise<string> {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing chars like 0/O, 1/I
        let code = '';
        let isUnique = false;

        while (!isUnique) {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Check existence
            const q = query(collection(db, this.COLLECTION), where('code', '==', code));
            const snapshot = await getDocs(q);
            if (snapshot.empty) isUnique = true;
        }
        return code;
    }

    /**
     * Creates a new Event
     */
    async createEvent(title: string, userId: string) {
        const code = await this.generateUniqueCode();

        const eventData = {
            title,
            code,
            createdBy: userId,
            createdAt: serverTimestamp(),
            status: 'SCHEDULED',
            settings: {
                timerDuration: 60,
                difficulty: 10
            }
        };

        const docRef = await addDoc(collection(db, this.COLLECTION), eventData);
        return { id: docRef.id, ...eventData };
    }

    /**
     * Finds an Event by Code
     */
    async getEventByCode(code: string): Promise<KickEvent | null> {
        const q = query(collection(db, this.COLLECTION), where('code', '==', code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as KickEvent;
    }

    /**
     * Register a Station to an Event
     */
    async registerStation(eventId: string, stationName: string) {
        const stationRef = doc(collection(db, `events/${eventId}/stations`));
        await setDoc(stationRef, {
            name: stationName,
            joinedAt: serverTimestamp(),
            status: 'ONLINE',
            lastHeartbeat: serverTimestamp()
        });
        return stationRef.id;
    }
}

export const eventService = new EventService();
