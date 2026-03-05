import React, { useState, useEffect } from 'react';
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

    const { miembros, loading: loadingMiembros, setFiltroGrupo } = useMiembros();

    // Sincronizar el grupo de programación con el filtro de miembros
    useEffect(() => {
        if (grupo) {
            setFiltroGrupo(grupo);
        }
    }, [grupo, setFiltroGrupo]);

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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Programación</h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                        Asigna miembros a actividades por domingo
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {saving && (
                        <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-wider animate-pulse bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                            <Loader2 size={12} className="animate-spin" />
                            Guardando...
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-right-4 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                            <CheckCircle2 size={12} />
                            {successMsg}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex flex-1 items-center gap-2">
                    {(listaGrupos.length > 1 || isAdmin) && (
                        <div className="flex-1 md:flex-none flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                            <MapPin size={14} className="text-primary shrink-0" />
                            <select
                                value={grupo}
                                onChange={e => setGrupo(e.target.value)}
                                className="w-full bg-transparent font-bold text-slate-700 text-xs md:text-sm outline-none cursor-pointer"
                            >
                                {listaGrupos.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden border-separate">
                        <button onClick={handleAnterior} className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-2 font-black text-slate-800 text-xs md:text-sm min-w-[110px] md:min-w-[140px] text-center">
                            {nombreMes} {anio}
                        </span>
                        <button onClick={handleSiguiente} className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {miembrosActivos.length > 0 && programacion && (
                    <button
                        onClick={handleGenerarAleatorio}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Wand2 size={14} />
                        Autocompletar
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
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden relative">
                    <div className="overflow-x-auto overflow-y-hidden custom-scrollbar max-h-[70vh]">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="sticky top-0 left-0 z-50 bg-slate-100 font-black text-slate-500 uppercase tracking-widest min-w-[100px] md:min-w-[180px] border-b border-r border-slate-100 px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[11px] shadow-[2px_2px_10px_rgba(0,0,0,0.03)]">
                                        Actividad
                                    </th>
                                    {programacion.reuniones.map((reunion, idx) => {
                                        const fecha = reunion.fecha instanceof Date ? reunion.fecha : new Date(reunion.fecha);
                                        const esHoy = fecha.toDateString() === new Date().toDateString();
                                        return (
                                            <th key={idx} className={clsx(
                                                "sticky top-0 z-40 px-4 py-4 md:py-6 text-center border-b border-l border-slate-100 min-w-[140px] md:min-w-[160px] transition-colors",
                                                esHoy ? "bg-primary/5 shadow-inner" : "bg-slate-50/80"
                                            )}>
                                                <div className="flex flex-col items-center">
                                                    <span className={clsx(
                                                        "text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5",
                                                        esHoy ? "text-primary" : "text-slate-400"
                                                    )}>
                                                        {DIAS_SEMANA[fecha.getDay()]}
                                                    </span>
                                                    <span className={clsx(
                                                        "text-lg md:text-2xl font-black leading-none",
                                                        esHoy ? "text-primary" : "text-slate-700"
                                                    )}>
                                                        {fecha.getDate()}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {programacion.actividades.map((actividad) => (
                                    <tr key={actividad} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 px-4 md:px-8 py-4 md:py-6 border-r border-slate-100 z-30 transition-colors shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                                            <div className={clsx(
                                                "inline-flex items-center px-2.5 md:px-4 py-1.5 rounded-xl border text-[8px] md:text-[11px] font-black uppercase tracking-widest whitespace-normal md:whitespace-nowrap leading-tight",
                                                ACTIVITY_STYLES[actividad] || ACTIVITY_STYLES['default']
                                            )}>
                                                {actividad}
                                            </div>
                                        </td>
                                        {programacion.reuniones.map((reunion, reunionIdx) => {
                                            const miembroAsignado = reunion.participaciones?.[actividad] || '';
                                            return (
                                                <td key={reunionIdx} className="px-3 py-3 border-l border-slate-50">
                                                    <div className="relative">
                                                        <select
                                                            value={miembroAsignado}
                                                            onChange={e => handleAsignar(reunionIdx, actividad, e.target.value)}
                                                            disabled={saving}
                                                            className={clsx(
                                                                "w-full pl-4 md:pl-8 pr-8 py-3.5 rounded-2xl border text-[11px] md:text-sm font-bold outline-none cursor-pointer transition-all appearance-none shadow-sm",
                                                                miembroAsignado
                                                                    ? (CELL_STYLES[actividad] || CELL_STYLES['default'])
                                                                    : "bg-slate-50/30 border-slate-100 text-slate-300 hover:border-slate-300 hover:bg-white"
                                                            )}
                                                        >
                                                            <option value="">(Sin asignar)</option>
                                                            {miembrosActivos.map(m => (
                                                                <option key={m.id} value={m.nombre}>{m.nombre}</option>
                                                            ))}
                                                        </select>
                                                        {miembroAsignado ? (
                                                            <div className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                        ) : (
                                                            <Search className="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 text-slate-200" size={12} />
                                                        )}
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
