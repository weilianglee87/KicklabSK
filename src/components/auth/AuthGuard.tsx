import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/AuthStore';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const AuthGuard = ({ children, requireAdmin = false }: AuthGuardProps) => {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                if (requireAdmin) navigate('/login/admin');
                else navigate('/login/station');
            }
        });
        return () => unsubscribe();
    }, [navigate, setUser, requireAdmin]);

    if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Auth...</div>;

    return <>{children}</>;
};
