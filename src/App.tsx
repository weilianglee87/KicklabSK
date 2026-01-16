import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';

// Features
import { AdminDashboard } from './features/admin/AdminDashboard';
import { StationLobby } from './features/station/StationLobby';
import { LegacyGameScreen } from './features/station/LegacyGameScreen';
import { ConnectedGameScreen } from './features/station/ConnectedGameScreen';
import { PublicJoin } from './features/public/PublicJoin';
import { PublicBoard } from './features/public/PublicBoard';

// Auth
import { AdminLogin } from './components/auth/AdminLogin';
import { StationJoin } from './components/auth/StationJoin';
import { AuthGuard } from './components/auth/AuthGuard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login/station" replace />} />

                {/* Auth Routes */}
                <Route path="/login/admin" element={<AdminLogin />} />
                <Route path="/login/station" element={<StationJoin />} />

                {/* Protected Admin Routes */}
                <Route path="/admin/*" element={
                    <AuthGuard requireAdmin={true}>
                        <AdminDashboard />
                    </AuthGuard>
                } />

                {/* Protected Station Routes */}
                <Route path="/station/*" element={
                    // <AuthGuard>
                    <Routes>
                        <Route path="lobby" element={<StationLobby />} />
                        <Route path="game" element={<ConnectedGameScreen />} />
                        <Route path="*" element={<Navigate to="lobby" replace />} />
                    </Routes>
                    // </AuthGuard>
                } />

                {/* Public Display Routes */}
                <Route path="/display" element={<PublicJoin />} />
                <Route path="/display/:eventId" element={<PublicBoard />} />

                {/* Legacy Route */}
                <Route path="/legacy" element={
                    <GameProvider>
                        <div className="w-screen h-screen bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                            <LegacyGameScreen />
                        </div>
                    </GameProvider>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
