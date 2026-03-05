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
    Calendar as CalendarIcon,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
        <div className={clsx("absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-[0.03] transition-transform group-hover:scale-110", color)} />
        <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className={clsx("p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg shadow-current/10", color)}>
                <Icon size={20} className="md:w-6 md:h-6 text-white" />
            </div>
            {trend && (
                <div className={clsx("flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg",
                    trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trendValue}
                </div>
            )}
        </div>
        <p className="text-slate-500 text-[10px] md:text-sm font-semibold truncate leading-tight">{title}</p>
        <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 mt-0.5 md:mt-1">{value}</h3>
    </div>
);

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-xl min-w-[200px]">
                <p className="font-bold text-white mb-2">{label}</p>
                <div className="flex items-center gap-2 text-primary font-bold mb-3">
                    <Users size={16} />
                    <span>{data.total} Asistentes</span>
                </div>
                {data.miembros && data.miembros.length > 0 ? (
                    <div className="space-y-1 mt-2 border-t border-slate-700 pt-3">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Miembros:</p>
                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {data.miembros.map((m, i) => (
                                <div key={i} className="text-xs text-slate-300 flex items-center gap-2 py-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></div>
                                    <span className="truncate">{m}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-[10px] text-slate-500 italic mt-2">Nombres no registrados</p>
                )}
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Filtros de fecha local
    const hoy = new Date();
    const [filtroMes, setFiltroMes] = React.useState(hoy.getMonth());
    const [filtroAnio, setFiltroAnio] = React.useState(hoy.getFullYear());

    // Asegurar que no se pueda elegir un mes en el futuro si estamos en el año actual
    const mesesDisponibles = React.useMemo(() => {
        if (filtroAnio < hoy.getFullYear()) return MESES;
        return MESES.slice(0, hoy.getMonth() + 1);
    }, [filtroAnio, hoy]);

    // Opciones de año (desde 2024 hasta el actual)
    const aniosDisponibles = React.useMemo(() => {
        const agnos = [];
        for (let a = 2024; a <= hoy.getFullYear(); a++) agnos.push(a);
        return agnos;
    }, [hoy]);

    // Se carga toda la info y se filtra localmente
    const rol = profile?.rol?.toLowerCase() || '';
    const esAdmin = rol === 'admin';
    const esPastor = rol === 'pastor';
    const puedeVerTodo = esAdmin || esPastor;
    const { miembros, loading: loadingMiembros, error: errorMiembros, listaGrupos, filtroGrupo, setFiltroGrupo } = useMiembros();
    const { asistencias, loading: loadingAsistencias, error: errorAsistencias } = useAsistencias(puedeVerTodo ? (filtroGrupo || null) : (filtroGrupo || profile?.grupoAsignado), filtroMes, filtroAnio);

    const currentError = errorMiembros || errorAsistencias;

    // 1. Activos en Este Mes Exacto
    const miembrosActivosHistorico = useMemo(() => {
        return miembros.filter(m => {
            // Un miembro estaba activo si no está inactivo, o si se inactivó DESPUÉS del mes seleccionado
            // Para simplificar, asumimos que si su estado no es "Inactivo/Baja" es activo.
            return m.activo !== false;
        }).length;
    }, [miembros, filtroMes, filtroAnio]);

    // 2. Nuevos en el Mes Seleccionado vs Mes Anterior
    const { nuevosEnMes, nuevosMesAnterior } = useMemo(() => {
        let nuevosEnMes = 0;
        let nuevosMesAnterior = 0;

        // Calcular mes y año anterior
        let anioAnterior = filtroAnio;
        let mesAnterior = filtroMes - 1;
        if (mesAnterior < 0) {
            mesAnterior = 11;
            anioAnterior -= 1;
        }

        miembros.forEach(m => {
            if (!m.createdAt) return;
            const fechaIngreso = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
            const mMes = fechaIngreso.getMonth();
            const mAnio = fechaIngreso.getFullYear();

            // Es del mes actual seleccionado?
            if (mMes === filtroMes && mAnio === filtroAnio) {
                nuevosEnMes++;
            }
            // Es del mes inmediatamente anterior al seleccionado?
            else if (mMes === mesAnterior && mAnio === anioAnterior) {
                nuevosMesAnterior++;
            }
        });

        return { nuevosEnMes, nuevosMesAnterior };
    }, [miembros, filtroMes, filtroAnio]);

    const diferenciaNuevos = nuevosEnMes - nuevosMesAnterior;
    const trendNuevos = diferenciaNuevos > 0 ? 'up' : diferenciaNuevos < 0 ? 'down' : null;

    // 3. Seguimiento Activos Histórico (Miembros que requieren seguimiento y están activos)
    const seguimientoActivo = useMemo(() => {
        return miembros.filter(m =>
            m.activo !== false &&
            ['Requiere visita', 'Requiere llamada'].includes(m.estadoSeguimiento)
        ).length;
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

            // Extraer lista base de asistentes manejando múltiples formatos posibles
            const listaBase = asist.presentes || asist.asistentes || asist.miembros || [];

            // Mapear a nombres de forma segura
            const nombres = listaBase.map(p => {
                if (typeof p === 'string') return p;
                if (typeof p === 'object' && p !== null) return p.nombre || p.name || 'Sin nombre';
                return 'No identificado';
            });

            return {
                name: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                total: asist.totalPresentes ?? asist.total ?? 0,
                miembros: nombres
            };
        });
    }, [asistencias]);

    // 5. Asistencia Promedio (últimas asistencias)
    const asistenciaPromedio = useMemo(() => {
        if (asistencias.length === 0) return 0;
        const total = asistencias.reduce((sum, a) => sum + (a.totalPresentes ?? a.total ?? 0), 0);
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
            {/* Header con Filtros */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard General</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gestionando:</p>
                        {listaGrupos && (listaGrupos.length > 1 || profile?.isAdmin) ? (
                            <select
                                value={filtroGrupo}
                                onChange={(e) => setFiltroGrupo(e.target.value)}
                                className="bg-slate-100 px-3 py-1 rounded-lg border-none outline-none text-primary font-bold text-[11px] cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                                {profile?.isAdmin && <option value="">Todos los grupos</option>}
                                {listaGrupos.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-primary font-bold uppercase tracking-widest text-[10px]">
                                {filtroGrupo || profile?.grupoAsignado || 'Sin Grupo'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 self-start lg:self-auto">
                    <Filter className="text-primary ml-2" size={18} />
                    <select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(parseInt(e.target.value))}
                        className="bg-transparent border-none outline-none font-black text-slate-700 cursor-pointer pl-1 focus:ring-0"
                    >
                        {mesesDisponibles.map((mes, idx) => (
                            <option key={idx} value={idx}>{mes}</option>
                        ))}
                    </select>
                    <span className="text-slate-300">/</span>
                    <select
                        value={filtroAnio}
                        onChange={(e) => {
                            const newAnio = parseInt(e.target.value);
                            setFiltroAnio(newAnio);
                            // Ajustar el mes si elegimos el año actual y el mes estaba seleccionado en el futuro
                            if (newAnio === hoy.getFullYear() && filtroMes > hoy.getMonth()) {
                                setFiltroMes(hoy.getMonth());
                            }
                        }}
                        className="bg-transparent border-none outline-none font-black text-slate-700 cursor-pointer pr-2 focus:ring-0"
                    >
                        {aniosDisponibles.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Miembros Activos"
                    value={miembrosActivosHistorico}
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
                    title={`Nuevos en ${MESES[filtroMes]}`}
                    value={nuevosEnMes}
                    icon={UserPlus}
                    trend={trendNuevos}
                    trendValue={diferenciaNuevos === 0 ? '=' : diferenciaNuevos > 0 ? `+${diferenciaNuevos}` : diferenciaNuevos}
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
                    <div className="h-80 w-full relative min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    wrapperStyle={{ pointerEvents: 'auto' }}
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
                            <span className="font-bold">{Math.round(miembrosActivosHistorico * 1.1) || 50}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-slate-400 text-sm">Miembros Totales</span>
                            <span className="font-bold">{miembrosActivosHistorico}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/asistencias')}
                        className="w-full bg-white text-slate-900 font-extrabold py-4 rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CalendarIcon size={18} />
                        Ir a Asistencias
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
