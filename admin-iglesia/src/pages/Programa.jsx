import React, { useState } from 'react';
import { useProgramacion } from '../hooks/useProgramacion';
import { useMiembros } from '../hooks/useMiembros';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Users,
    MapPin,
    Search,
    Wand2
} from 'lucide-react';
import { clsx } from 'clsx';
import AlertDialog from '../components/ui/AlertDialog';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ACTIVITY_STYLES = {
    'Bienvenida': 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    'Alabanzas y adoración': 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
    'Ofrenda y anuncios': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    'Dinámica 1': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    'Dinámica 2': 'bg-pink-50 text-pink-700 border-pink-200 ring-pink-500/10',
    'Enseñanza y ministración': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    'default': 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10'
};

const CELL_STYLES = {
    'Bienvenida': 'bg-blue-50/40 border-blue-100 text-blue-800 hover:bg-blue-50 hover:border-blue-200 shadow-blue-50/50',
    'Alabanzas y adoración': 'bg-purple-50/40 border-purple-100 text-purple-800 hover:bg-purple-50 hover:border-purple-200 shadow-purple-50/50',
    'Ofrenda y anuncios': 'bg-amber-50/40 border-amber-100 text-amber-800 hover:bg-amber-50 hover:border-amber-200 shadow-amber-50/50',
    'Dinámica 1': 'bg-rose-50/40 border-rose-100 text-rose-800 hover:bg-rose-50 hover:border-rose-200 shadow-rose-50/50',
    'Dinámica 2': 'bg-pink-50/40 border-pink-100 text-pink-800 hover:bg-pink-50 hover:border-pink-200 shadow-pink-50/50',
    'Enseñanza y ministración': 'bg-emerald-50/40 border-emerald-100 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 shadow-emerald-50/50',
    'default': 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
};

const Programa = () => {
    const { profile } = useAuth();

    const {
        mes, setMes,
        anio, setAnio,
        grupo, setGrupo,
        listaGrupos,
        isAdmin,
        programacion,
        loading,
        saving,
        error,
        nombreMes,
        asignarActividad,
        generarProgramacionAleatoria
    } = useProgramacion();

    const { miembros, loading: loadingMiembros } = useMiembros();

    const [successMsg, setSuccessMsg] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 2000);
    };

    const handleAnterior = () => {
        if (mes === 0) { setMes(11); setAnio(a => a - 1); }
        else setMes(m => m - 1);
    };

    const handleSiguiente = () => {
        if (mes === 11) { setMes(0); setAnio(a => a + 1); }
        else setMes(m => m + 1);
    };

    const handleGenerarAleatorio = () => {
        setIsAlertOpen(true);
    };

    const confirmarGenerarAleatorio = async () => {
        const nombres = miembrosActivos.map(m => m.nombre);
        await generarProgramacionAleatoria(nombres);
        setIsAlertOpen(false);
        showSuccess('Mes autocompletado');
    };

    const handleAsignar = async (reunionIdx, actividad, nombreMiembro) => {
        await asignarActividad(reunionIdx, actividad, nombreMiembro);
        showSuccess('Guardado');
    };

    const miembrosActivos = miembros.filter(m => m.activo !== false);

    if (loading || loadingMiembros) return (
        <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Cargando programación...</p>
        </div>
    );

    if (!profile?.grupoAsignado && !profile?.isAdmin) return (
        <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-12 text-center max-w-2xl mx-auto">
            <Users size={48} className="text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Sin Grupo Asignado</h2>
            <p className="text-slate-500">Contacta al administrador para asignarte un grupo.</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Programación Mensual</h1>
                    <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">
                        Asigna un miembro a cada actividad por domingo
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {saving && (
                        <div className="flex items-center gap-2 text-primary text-xs font-bold animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            Guardando...
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold animate-in fade-in slide-in-from-right-4">
                            <CheckCircle2 size={14} />
                            {successMsg}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {(listaGrupos.length > 1 || isAdmin) && (
                    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
                        <MapPin size={16} className="text-primary" />
                        <select
                            value={grupo}
                            onChange={e => setGrupo(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 text-sm outline-none cursor-pointer"
                        >
                            {listaGrupos.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <button onClick={handleAnterior} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 font-black text-slate-800 text-sm min-w-[140px] text-center">
                        {nombreMes} {anio}
                    </span>
                    <button onClick={handleSiguiente} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="flex-1" />

                {miembrosActivos.length > 0 && programacion && (
                    <button
                        onClick={handleGenerarAleatorio}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-200 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Wand2 size={18} />
                        Autocompletar Mes
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {programacion && miembrosActivos.length > 0 ? (
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden relative group">
                    {/* Indicador de scroll para móvil */}
                    <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-l from-white to-transparent w-8 h-full pointer-events-none opacity-50" />

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    <th className="sticky left-0 z-30 bg-slate-50 font-black text-slate-400 uppercase tracking-widest min-w-[140px] md:min-w-[180px] border-b border-slate-100 px-6 md:px-8 py-5 text-[9px] md:text-[11px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        Actividad
                                    </th>
                                    {programacion.reuniones.map((reunion, idx) => {
                                        const fecha = reunion.fecha instanceof Date ? reunion.fecha : new Date(reunion.fecha);
                                        const esHoy = fecha.toDateString() === new Date().toDateString();
                                        return (
                                            <th key={idx} className={clsx(
                                                "px-4 py-5 text-center text-[10px] md:text-[11px] font-black uppercase tracking-wider border-b border-l border-slate-100 min-w-[110px] md:min-w-0",
                                                esHoy ? "text-primary bg-primary/5" : "text-slate-400"
                                            )}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <Calendar size={13} className={esHoy ? "text-primary" : "text-slate-300"} />
                                                    <span>{DIAS_SEMANA[fecha.getDay()]}</span>
                                                    <span className="text-base font-black leading-none">{fecha.getDate()}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {programacion.actividades.map((actividad) => (
                                    <tr key={actividad} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 px-6 md:px-8 py-6 border-r border-slate-100 z-20 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.01)]">
                                            <div className={clsx(
                                                "inline-flex items-center px-3 md:px-4 py-1.5 rounded-full border text-[9px] md:text-[11px] font-black uppercase tracking-widest ring-1 whitespace-nowrap",
                                                ACTIVITY_STYLES[actividad] || ACTIVITY_STYLES['default']
                                            )}>
                                                {actividad}
                                            </div>
                                        </td>
                                        {programacion.reuniones.map((reunion, reunionIdx) => {
                                            const miembroAsignado = reunion.participaciones?.[actividad] || '';
                                            return (
                                                <td key={reunionIdx} className="px-3 py-4 border-l border-slate-50 align-top">
                                                    <div className="relative group/select">
                                                        <select
                                                            value={miembroAsignado}
                                                            onChange={e => handleAsignar(reunionIdx, actividad, e.target.value)}
                                                            disabled={saving}
                                                            className={clsx(
                                                                "w-full pl-8 pr-9 py-3 rounded-2xl border text-[12px] font-bold outline-none cursor-pointer transition-all appearance-none shadow-sm",
                                                                miembroAsignado
                                                                    ? (CELL_STYLES[actividad] || CELL_STYLES['default'])
                                                                    : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-white"
                                                            )}
                                                        >
                                                            <option value="">Sin asignar</option>
                                                            {miembrosActivos.map(m => (
                                                                <option key={m.id} value={m.nombre}>{m.nombre}</option>
                                                            ))}
                                                        </select>
                                                        {miembroAsignado ? (
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                        ) : (
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                        )}
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {programacion.actividades.length} actividades · {programacion.reuniones.length} reunión{programacion.reuniones.length !== 1 ? 'es' : ''}
                            </p>
                            {saving && (
                                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    <Loader2 size={12} className="animate-spin" />
                                    Guardando en la nube...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : programacion && miembrosActivos.length === 0 ? (
                <div className="bg-white rounded-[3rem] shadow-xl p-16 text-center">
                    <Users size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No hay miembros activos en este grupo para asignar</p>
                </div>
            ) : null}

            <AlertDialog
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                onConfirm={confirmarGenerarAleatorio}
                title="¿Autocompletar Mes?"
                description="Esto reemplazará cualquier asignación actual. Asignaremos aleatoriamente a todos los miembros activos por lo menos una vez."
                confirmText="Sí, autocompletar"
                cancelText="Cancelar"
                variant="warning"
                isLoading={saving}
            />
        </div>
    );
};

export default Programa;
