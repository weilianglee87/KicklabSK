import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AuthState {
    user: User | null;
    stationId: string | null;
    eventId: string | null;
    isLoading: boolean;

    setUser: (user: User | null) => void;
    setStation: (stationId: string, eventId: string) => void;
    clearStation: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    stationId: localStorage.getItem('sk_station_id'), // Persist across reloads
    eventId: localStorage.getItem('sk_event_id'),
    isLoading: true,

    setUser: (user) => set({ user, isLoading: false }),

    setStation: (stationId, eventId) => {
        localStorage.setItem('sk_station_id', stationId);
        localStorage.setItem('sk_event_id', eventId);
        set({ stationId, eventId });
    },

    clearStation: () => {
        localStorage.removeItem('sk_station_id');
        localStorage.removeItem('sk_event_id');
        set({ stationId: null, eventId: null });
    }
}));
