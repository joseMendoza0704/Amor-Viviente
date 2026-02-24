import React, { useMemo } from 'react';
import { useMiembros } from '../hooks/useMiembros';
import { useAsistencias } from '../hooks/useAsistencias';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    TrendingUp,
    UserPlus,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar as CalendarIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
        <div className={clsx("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] transition-transform group-hover:scale-110", color)} />
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-2xl shadow-lg shadow-current/10", color)}>
                <Icon size={24} className="text-white" />
            </div>
            {trend && (
                <div className={clsx("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                    trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trendValue}
                </div>
            )}
        </div>
        <p className="text-slate-500 text-sm font-semibold">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
    </div>
);

const Dashboard = () => {
    const { profile } = useAuth();
    const { miembros, loading: loadingMiembros, error: errorMiembros } = useMiembros();
    const { asistencias, loading: loadingAsistencias, error: errorAsistencias } = useAsistencias();

    const currentError = errorMiembros || errorAsistencias;

    // 1. Total Miembros
    const totalMiembros = miembros.length;

    // 2. Nuevos Hoy (fechaPrimeraVisita de hoy en adelante)
    const nuevosHoy = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return miembros.filter(m => {
            if (!m.fechaPrimeraVisita) return false;
            // Manejar si es un timestamp de Firebase o un Date/String
            const fechaVisita = m.fechaPrimeraVisita.toDate ? m.fechaPrimeraVisita.toDate() : new Date(m.fechaPrimeraVisita);
            return fechaVisita >= today;
        }).length;
    }, [miembros]);

    // 3. Seguimiento Activo
    const seguimientoActivo = useMemo(() => {
        return miembros.filter(m => m.estadoSeguimiento === 'si').length;
    }, [miembros]);

    // 4. Datos del Gráfico (Asistencias Reales)
    const chartData = useMemo(() => {
        if (!asistencias || asistencias.length === 0) {
            return [
                { name: 'Sin datos', total: 0 }
            ];
        }

        return asistencias.map(asist => {
            const fecha = asist.timestamp?.toDate ? asist.timestamp.toDate() : new Date(asist.timestamp);
            return {
                name: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                total: asist.total || 0,
                miembros: asist.miembros || []
            };
        });
    }, [asistencias]);

    // 5. Asistencia Promedio (últimas asistencias)
    const asistenciaPromedio = useMemo(() => {
        if (asistencias.length === 0) return 0;
        const total = asistencias.reduce((sum, a) => sum + (a.total || 0), 0);
        return Math.round(total / asistencias.length);
    }, [asistencias]);

    if (loadingMiembros || loadingAsistencias) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (currentError) {
        return (
            <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
                <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900">Error al cargar el Dashboard</h3>
                <p className="text-red-600 mt-2">{currentError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-bold"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard General</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        {profile?.grupoAsignado ? `Mostrando datos de: ${profile.grupoAsignado}` : "Resumen de actividad"}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Miembros"
                    value={totalMiembros}
                    icon={Users}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Asistencia Promedio"
                    value={asistenciaPromedio}
                    icon={Activity}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Nuevos Hoy"
                    value={nuevosHoy}
                    icon={UserPlus}
                    trend={nuevosHoy > 0 ? "up" : null}
                    trendValue={nuevosHoy > 0 ? `+${nuevosHoy}` : null}
                    color="bg-amber-600"
                />
                <StatCard
                    title="Seguimiento Activo"
                    value={seguimientoActivo}
                    icon={TrendingUp}
                    color="bg-emerald-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Tendencia de Asistencia</h3>
                            <p className="text-sm text-slate-400 mt-1">Total de personas asistidas por fecha</p>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Últimas reuniones</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                    formatter={(value) => [`${value} asistentes`, 'Total']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold mb-4 backdrop-blur-sm">
                            <CalendarIcon size={14} />
                            Próxima Reunión
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Grupo de {profile?.grupoAsignado || 'Amistad'}</h3>
                        <p className="text-slate-400 font-medium">Este Domingo - 10:00 AM</p>
                    </div>

                    <div className="space-y-4 my-8">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-slate-400 text-sm">Meta de Asistencia</span>
                            <span className="font-bold">{Math.round(totalMiembros * 1.1) || 50}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-slate-400 text-sm">Miembros Actuales</span>
                            <span className="font-bold">{totalMiembros}</span>
                        </div>
                    </div>

                    <button className="w-full bg-white text-slate-900 font-extrabold py-4 rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95">
                        Tomar Asistencia
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
