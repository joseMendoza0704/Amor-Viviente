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
    User
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
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            isActive
                ? "bg-primary text-white shadow-md shadow-blue-200"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        )}
    >
        <Icon size={20} className={cn("transition-colors", "group-hover:text-primary")} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const MainLayout = ({ children }) => {
    const { user, profile, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

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

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
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
                        <SidebarItem to="/miembros" icon={Users} label="Directorio CRM" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem to="/asistencias" icon={CheckSquare} label="Asistencias" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem to="/inventario" icon={Package} label="Inventario" onClick={() => setIsSidebarOpen(false)} />
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
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navbar (Mobile only header) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
                    <span className="font-bold text-slate-900">Amor Viviente</span>
                    <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
