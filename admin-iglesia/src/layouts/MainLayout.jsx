import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    Package,
    LogOut,
    Menu,
    X,
    User,
    UserCog,
    Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group selection:bg-transparent",
            isActive
                ? "bg-primary text-white shadow-lg shadow-blue-200 scale-[1.02]"
                : "text-slate-400 hover:bg-slate-50 hover:text-primary"
        )}
    >
        <Icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110")} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
    </NavLink>
);

const BottomNavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className="flex-1">
        {({ isActive }) => (
            <div className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-2 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-slate-400"
            )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
            </div>
        )}
    </NavLink>
);

const MainLayout = ({ children }) => {
    const { user, profile, logout, isAdmin } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const rol = profile?.rol?.toLowerCase() || '';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-slate-50 font-inter">
            {/* Overlay para móvil */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar Desktop */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 transform transition-transform duration-500 ease-in-out md:translate-x-0 hidden md:block",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            Amor Viviente
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 space-y-2">
                        <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem to="/miembros" icon={Users} label="Congregantes" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem to="/programa" icon={Calendar} label="Programa" onClick={() => setIsSidebarOpen(false)} />
                        {(rol === 'lider' || rol === 'líder' || isAdmin) && (
                            <SidebarItem to="/asistencias" icon={CheckSquare} label="Asistencias" onClick={() => setIsSidebarOpen(false)} />
                        )}
                        {rol === 'admin' && (
                            <SidebarItem to="/usuarios" icon={UserCog} label="Configuración Usuarios" onClick={() => setIsSidebarOpen(false)} />
                        )}
                    </nav>

                    {/* Perfil y Logout */}
                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-6 p-2">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                <User size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.nombre || user?.email}</p>
                                <p className="text-xs text-slate-500 truncate capitalize">{profile?.rol || 'Líder'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside >

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-72 overflow-hidden">
                {/* Top Navbar (Mobile only header) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
                    <span className="font-bold text-slate-900">Amor Viviente</span>
                    <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {children}
                    </div>
                </main>

                {/* Bottom Navigation (Mobile Only) */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pb-safe pt-2 flex items-center justify-between z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                    <BottomNavItem to="/" icon={LayoutDashboard} label="Inicio" />
                    <BottomNavItem to="/miembros" icon={Users} label="Gente" />
                    {(rol === 'lider' || rol === 'líder' || isAdmin) && (
                        <BottomNavItem to="/asistencias" icon={CheckSquare} label="Lista" />
                    )}
                    <BottomNavItem to="/programa" icon={Calendar} label="Prog." />
                </nav>

                {/* Sidebar Móvil (Drawer) */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={toggleSidebar} />
                        <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-right duration-500 p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Menú</span>
                                <button onClick={toggleSidebar} className="p-2 bg-slate-50 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 space-y-2">
                                {rol === 'admin' && (
                                    <SidebarItem to="/usuarios" icon={UserCog} label="Usuarios" onClick={toggleSidebar} />
                                )}
                                <div className="pt-4 mt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">{profile?.nombre || user?.email}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile?.rol || 'Líder'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-4 text-red-500 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]"
                                    >
                                        <LogOut size={18} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainLayout;
