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

    // Usamos useMiembros para obtener la lista de miembros del grupo actual
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
        const nombres = miembrosActivos.map(m => m.nombre);
        if (nombres.length === 0) return;

        // Mostrar alerta personalizada en lugar de window.confirm
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

    // Miembros activos del grupo que se mostrarán en los dropdowns
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

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Programación Mensual</h1>
                    <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">
                        Asigna un miembro a cada actividad por domingo
                    </p>
                </div>

                {/* Estado de guardado */}
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

            {/* ── Controles: grupo + mes/año ── */}
            <div className="flex flex-wrap items-center gap-4">

                {/* Selector de grupo (si tiene más de uno) */}
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

                {/* Navegador mes/año */}
                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <button
                        onClick={handleAnterior}
                        className="p-3 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 font-black text-slate-800 text-sm min-w-[140px] text-center">
                        {nombreMes} {anio}
                    </span>
                    <button
                        onClick={handleSiguiente}
                        className="p-3 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Grupo actual (si solo tiene uno) */}
                {listaGrupos.length === 1 && (
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{grupo}</span>
                    </div>
                )}

                <div className="flex-1" />

                {/* Botón Mágico Autocompletar */}
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

            {/* ── Tabla de Programación (Filas: Actividades, Cols: Domingos) ── */}
            {programacion && miembrosActivos.length > 0 ? (
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/60">
                                    {/* Columna fija: Actividad */}
                                    <th className="sticky left-0 z-10 bg-slate-50/60 px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] border-b border-slate-100">
                                        Actividad a realizar
                                    </th>
                                    {/* Columnas: un domingo por reunión */}
                                    {programacion.reuniones.map((reunion, idx) => {
                                        const fecha = reunion.fecha instanceof Date ? reunion.fecha : new Date(reunion.fecha);
                                        const esHoy = fecha.toDateString() === new Date().toDateString();
                                        return (
                                            <th
                                                key={idx}
                                                className={clsx(
                                                    "px-6 py-5 text-center text-[11px] font-black uppercase tracking-wider min-w-[240px] border-b border-l border-slate-100",
                                                    esHoy ? "text-primary bg-primary/5" : "text-slate-400"
                                                )}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <Calendar size={13} className={esHoy ? "text-primary" : "text-slate-300"} />
                                                    <span>{DIAS_SEMANA[fecha.getDay()]}</span>
                                                    <span className="text-base font-black leading-none">
                                                        {fecha.getDate()}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-50">
                                {programacion.actividades.map((actividad) => (
                                    <tr key={actividad} className="hover:bg-blue-50/10 transition-colors group">

                                        {/* Nombre de la actividad */}
                                        <td className="sticky left-0 bg-white group-hover:bg-blue-50/10 px-8 py-5 border-r border-slate-50 z-10">
                                            <p className="font-bold text-slate-700 text-[13px]">{actividad}</p>
                                        </td>

                                        {/* Celdas de selección de miembro por domingo */}
                                        {programacion.reuniones.map((reunion, reunionIdx) => {
                                            // En Firestore guardamos: participaciones: { "Bienvenida": "Juan Pérez", ... }
                                            const miembroAsignado = reunion.participaciones?.[actividad] || '';

                                            return (
                                                <td
                                                    key={reunionIdx}
                                                    className="px-6 py-4 border-l border-slate-50 align-top"
                                                >
                                                    <div className="relative group/select">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                        <select
                                                            value={miembroAsignado}
                                                            onChange={e => handleAsignar(reunionIdx, actividad, e.target.value)}
                                                            disabled={saving}
                                                            className={clsx(
                                                                "w-full pl-9 pr-8 py-2.5 rounded-xl border text-[12px] font-bold outline-none cursor-pointer transition-all appearance-none",
                                                                miembroAsignado
                                                                    ? "bg-primary/5 border-primary/20 text-primary hover:border-primary/40"
                                                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                                                            )}
                                                        >
                                                            <option value="">— Buscar miembro —</option>
                                                            {miembrosActivos.map(m => (
                                                                <option key={m.id} value={m.nombre}>
                                                                    {m.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {/* Icono caret para select nativo */}
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
                    </div>

                    {/* Footer de la tabla */}
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
            ) : programacion && miembrosActivos.length === 0 ? (
                <div className="bg-white rounded-[3rem] shadow-xl p-16 text-center">
                    <Users size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">
                        No hay miembros activos en este grupo para asignar
                    </p>
                </div>
            ) : null}

            {/* Modal de confirmación */}
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
