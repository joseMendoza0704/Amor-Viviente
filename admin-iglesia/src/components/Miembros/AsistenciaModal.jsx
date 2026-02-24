import React, { useState } from 'react';
import {
    X,
    Calendar,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    Save
} from 'lucide-react';
import { clsx } from 'clsx';

const AsistenciaModal = ({ isOpen, onClose, member, asistencias, onUpdateMemberAsistencia }) => {
    const [loadingMap, setLoadingMap] = useState({});

    if (!isOpen || !member) return null;

    const handleUpdate = async (asistenciaId, nuevoEstado) => {
        setLoadingMap(prev => ({ ...prev, [asistenciaId]: true }));
        try {
            await onUpdateMemberAsistencia(asistenciaId, member.nombre, nuevoEstado);
        } catch (error) {
            alert("Error al actualizar asistencia: " + error.message);
        } finally {
            setLoadingMap(prev => ({ ...prev, [asistenciaId]: false }));
        }
    };

    const getEstadoAsistencia = (asist) => {
        if (asist.miembros?.includes(member.nombre)) return 'asistio';
        if (asist.justificados?.includes(member.nombre)) return 'excusa';
        return 'falto';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 translate-z-0">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />

            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
                {/* Header */}
                <div className="bg-slate-50/50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Corregir Asistencia</h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Miembro: <span className="text-primary">{member.nombre}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-10 py-8 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {asistencias.map((asist) => {
                            const currentEstado = getEstadoAsistencia(asist);
                            const date = asist.timestamp?.toDate ? asist.timestamp.toDate() : new Date(asist.timestamp);
                            const dateLabel = date.toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                            const isLoading = loadingMap[asist.id];

                            return (
                                <div key={asist.id} className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-slate-50 group-hover:bg-primary group-hover:text-white transition-all">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-slate-700">{dateLabel}</p>
                                            <p className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest mt-0.5",
                                                currentEstado === 'asistio' ? 'text-green-500' :
                                                    currentEstado === 'excusa' ? 'text-amber-500' : 'text-red-500'
                                            )}>
                                                {currentEstado === 'asistio' ? 'Asistió' :
                                                    currentEstado === 'excusa' ? 'Justificado' : 'Ausente'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm relative shadow-inner">
                                        {isLoading ? (
                                            <div className="px-8 py-1">
                                                <Loader2 size={16} className="animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => currentEstado !== 'asistio' && handleUpdate(asist.id, 'asistio')}
                                                    className={clsx(
                                                        "p-2 rounded-xl transition-all",
                                                        currentEstado === 'asistio'
                                                            ? "bg-green-500 text-white shadow-lg shadow-green-200"
                                                            : "hover:bg-green-50 text-slate-300 hover:text-green-500"
                                                    )}
                                                    title="Marcar Asistencia"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => currentEstado !== 'excusa' && handleUpdate(asist.id, 'excusa')}
                                                    className={clsx(
                                                        "p-2 rounded-xl transition-all",
                                                        currentEstado === 'excusa'
                                                            ? "bg-amber-400 text-white shadow-lg shadow-amber-200"
                                                            : "hover:bg-amber-50 text-slate-300 hover:text-amber-500"
                                                    )}
                                                    title="Marcar Excusa"
                                                >
                                                    <AlertCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => currentEstado !== 'falto' && handleUpdate(asist.id, 'falto')}
                                                    className={clsx(
                                                        "p-2 rounded-xl transition-all",
                                                        currentEstado === 'falto'
                                                            ? "bg-red-500 text-white shadow-lg shadow-red-200"
                                                            : "hover:bg-red-50 text-slate-300 hover:text-red-500"
                                                    )}
                                                    title="Marcar Falta"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                        Los cambios se guardan automáticamente
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AsistenciaModal;
