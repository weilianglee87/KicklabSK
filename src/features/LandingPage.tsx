import { Link } from 'react-router-dom';
import { Monitor, Cpu, Settings, ExternalLink } from 'lucide-react';
import bgImage from '../assets/background.jpg';

export const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-black font-sans text-white overflow-hidden flex flex-col items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-sm" style={{ backgroundImage: `url(${bgImage})` }} />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            <div className="relative z-10 text-center mb-12 animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
                    <span className="text-blue-500">Kicklab</span> Speed Kick
                </h1>
                <p className="text-xl text-blue-200/80 font-medium tracking-wide">Cloud Competition Platform</p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-6">

                {/* Admin Card */}
                <Link to="/login/admin" className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-blue-900/40 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Settings className="w-8 h-8 text-blue-400 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-300">Admin Portal</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Create events, manage stations, and monitor live competitions.
                    </p>
                </Link>

                {/* Station Card */}
                <Link to="/login/station" className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-green-900/40 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Cpu className="w-8 h-8 text-green-400 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-green-300">Station App</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        The player interface. Connects to hardware sensors on the kiosk.
                    </p>
                </Link>

                {/* Public Card */}
                <Link to="/display" className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-purple-900/40 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Monitor className="w-8 h-8 text-purple-400 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300">Public Display</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Big screen mode for projectors. Shows live leaderboard & timer.
                    </p>
                </Link>

            </div>

            <div className="relative z-10 mt-16 text-slate-500 text-xs font-mono">
                System v1.0.0 • Kicklab Automation
            </div>
        </div>
    );
};
