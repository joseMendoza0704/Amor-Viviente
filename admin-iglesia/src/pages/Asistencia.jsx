import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMiembros } from '../hooks/useMiembros';
import AsistenciaService from '../services/AsistenciaService';
import AlertDialog from '../components/ui/AlertDialog';
import {
    CheckSquare,
    Users,
    Calendar,
    Search,
    Save,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    UserX,
    UserCheck,
    Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

const Asistencia = () => {
    const { profile } = useAuth();
    const { miembros, loading: loadingMiembros, listaGrupos, setFiltroGrupo } = useMiembros();

    // Estados internos
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [grupoSel, setGrupoSel] = useState(profile?.grupoAsignado || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [asistenciasMap, setAsistenciasMap] = useState({}); // { miembroId: { asistio: bool, observacion: string } }
    const [historialReciente, setHistorialReciente] = useState([]);
    const [loadingReporte, setLoadingReporte] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState(null);
    const [reporteCargado, setReporteCargado] = useState(null); // Guardar data del doc cargado

    // Estados para el modal de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. Efecto inicial: Sincronizar grupo desde el perfil del usuario
    useEffect(() => {
        if (profile?.grupoAsignado && !grupoSel) {
            setGrupoSel(profile.grupoAsignado);
        }
    }, [profile?.grupoAsignado, grupoSel]);

    // Cargar historial de reportes (últimos 10) con filtro de validez
    const cargarHistorial = async () => {
        if (!grupoSel) return;
        try {
            const data = await AsistenciaService.getAsistenciasPorGrupo(grupoSel, 15);
            // Filtrar solo los que tengan una fecha válida en formato YYYY-MM-DD
            const validos = data.filter(h => h.fecha && /^\d{4}-\d{2}-\d{2}$/.test(h.fecha));
            setHistorialReciente(validos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10));
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    // 2. Sincronizar filtros con el hook y cargar historial cuando cambie el grupo
    useEffect(() => {
        if (grupoSel) {
            setFiltroGrupo(grupoSel);
            cargarHistorial();
        }
    }, [grupoSel, successMsg, setFiltroGrupo]);

    // 3. Cargar reporte específico para la fecha seleccionada
    useEffect(() => {
        const cargarReporteExistente = async () => {
            if (!grupoSel || !fecha || loadingMiembros) return;

            setLoadingReporte(true);
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');

                // 1. Intentar buscar por el formato estándar YYYY-MM-DD
                const qStandard = query(
                    collection(db, "asistencia-iglesia"),
                    where("grupo", "==", grupoSel),
                    where("fecha", "==", fecha)
                );

                let snap = await getDocs(qStandard);
                let data = null;

                if (!snap.empty) {
                    data = snap.docs[0].data();
                } else {
                    // 2. Fallback: Buscar por fecha amplia (basada en el timestamp) 
                    // si no se encuentra por el campo 'fecha' exacto.
                    // Esto ayuda si la fecha se guardó como "Sun Feb 08..." o similar.
                    const dateObj = new Date(fecha + 'T12:00:00');
                    const inicioDia = new Date(dateObj);
                    inicioDia.setHours(0, 0, 0, 0);
                    const finDia = new Date(dateObj);
                    finDia.setHours(23, 59, 59, 999);

                    const { Timestamp } = await import('firebase/firestore');
                    const qTimestamp = query(
                        collection(db, "asistencia-iglesia"),
                        where("grupo", "==", grupoSel),
                        where("timestamp", ">=", Timestamp.fromDate(inicioDia)),
                        where("timestamp", "<=", Timestamp.fromDate(finDia))
                    );

                    const snapTS = await getDocs(qTimestamp);
                    if (!snapTS.empty) {
                        data = snapTS.docs[0].data();
                    }
                }

                if (data) {
                    const nuevoMap = {};

                    // Helper para encontrar ID por nombre si no viene en el reporte
                    const findIdByName = (name) => {
                        const m = miembros.find(mem => mem.nombre?.toLowerCase() === name?.toLowerCase());
                        return m ? m.id : null;
                    };

                    // 1. Mapear Formato Nuevo (Objetos con ID)
                    (data.presentes || []).forEach(p => {
                        const mid = p.id || findIdByName(p.nombre || p);
                        if (mid) nuevoMap[mid] = { estado: 'presente', observacion: p.observacion || '' };
                    });

                    (data.ausentes || []).forEach(a => {
                        const mid = a.id || findIdByName(a.nombre || a);
                        if (mid) nuevoMap[mid] = { estado: 'ausente', observacion: a.observacion || '' };
                    });

                    (data.excusados || []).forEach(e => {
                        const mid = e.id || findIdByName(e.nombre || e);
                        if (mid) nuevoMap[mid] = { estado: 'excusado', observacion: e.observacion || '' };
                    });

                    // 2. Soporte Híbrido: Formato Antiguo (Listas de nombres)
                    // Solo si el miembro no fue ya procesado por el formato nuevo
                    (data.miembros || []).forEach(nombre => {
                        const mid = findIdByName(nombre);
                        if (mid && !nuevoMap[mid]) {
                            nuevoMap[mid] = { estado: 'presente', observacion: '' };
                        }
                    });

                    (data.justificados || []).forEach(nombre => {
                        const mid = findIdByName(nombre);
                        if (mid && !nuevoMap[mid]) {
                            nuevoMap[mid] = { estado: 'excusado', observacion: '' };
                        }
                    });

                    setAsistenciasMap(nuevoMap);
                    setReporteCargado(data);
                } else {
                    // Resetear si no existe reporte para esa fecha
                    setAsistenciasMap({});
                    setReporteCargado(null);
                }
            } catch (err) {
                console.error("Error al cargar reporte:", err);
            } finally {
                setLoadingReporte(false);
            }
        };

        cargarReporteExistente();
    }, [fecha, grupoSel, loadingMiembros, miembros]);

    // Filtrar miembros por grupo y búsqueda
    const miembrosFiltrados = useMemo(() => {
        return miembros.filter(m => {
            const matchGrupo = grupoSel === '' || m.grupo === grupoSel;
            const matchSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const esActivo = m.activo !== false;
            return matchGrupo && matchSearch && esActivo;
        });
    }, [miembros, grupoSel, searchTerm]);

    // 4. Identificar miembros que están en el reporte pero no en la lista filtrada del grupo
    const miembrosExtra = useMemo(() => {
        if (!reporteCargado) return [];

        const idsEnGrupo = new Set(miembrosFiltrados.map(m => m.id));
        const extras = [];

        // Revisar todas las entradas de asistencia cargadas
        Object.entries(asistenciasMap).forEach(([id, data]) => {
            if (!idsEnGrupo.has(id)) {
                // Buscar si existe en la lista global de miembros
                const mGlobal = miembros.find(m => m.id === id);
                if (mGlobal) {
                    extras.push({ ...mGlobal, esExtra: true });
                } else {
                    // Si no existe (borrado o solo nombre), intentar sacar info del reporte
                    const encontrarEnLista = (lista) => lista?.find(item => (item.id === id || item.nombre === id || item === id));
                    const infoOrig = encontrarEnLista(reporteCargado.presentes) ||
                        encontrarEnLista(reporteCargado.ausentes) ||
                        encontrarEnLista(reporteCargado.excusados) ||
                        reporteCargado.miembros?.find(n => n === id) ||
                        reporteCargado.justificados?.find(n => n === id);

                    extras.push({
                        id,
                        nombre: infoOrig?.nombre || (typeof infoOrig === 'string' ? infoOrig : id),
                        grupo: 'Fuera de este grupo',
                        esExtra: true,
                        esInactivo: true
                    });
                }
            }
        });
        return extras;
    }, [asistenciasMap, miembrosFiltrados, reporteCargado, miembros]);

    // Combinar para los conteos y la UI
    const todosLosMiembrosVisibles = useMemo(() => [...miembrosFiltrados, ...miembrosExtra], [miembrosFiltrados, miembrosExtra]);

    // Handlers
    const setEstadoAsistencia = (id, nuevoEstado) => {
        setAsistenciasMap(prev => ({
            ...prev,
            [id]: { ...(prev[id] || { observacion: '' }), estado: nuevoEstado }
        }));
    };

    const setObservacion = (id, text) => {
        setAsistenciasMap(prev => ({
            ...prev,
            [id]: { ...(prev[id] || { estado: 'ausente' }), observacion: text }
        }));
    };

    const handleSave = async () => {
        if (!grupoSel) {
            setError("Selecciona un grupo primero");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const presentes = [];
            const ausentes = [];
            const excusados = [];

            // Procesar todos los miembros que se ven en pantalla
            todosLosMiembrosVisibles.forEach(m => {
                const data = asistenciasMap[m.id];
                const info = {
                    id: m.id,
                    nombre: m.nombre,
                    observacion: data?.observacion || ''
                };

                const estado = data?.estado || 'ausente';
                if (estado === 'presente') presentes.push(info);
                else if (estado === 'excusado') excusados.push(info);
                else ausentes.push(info);
            });

            // Registrar en Firestore
            const { serverTimestamp, Timestamp } = await import('firebase/firestore');
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../config/firebase');

            const dateObj = new Date(fecha + 'T12:00:00');
            const docId = `${grupoSel}_${fecha}`;
            const docRef = doc(db, "asistencia-iglesia", docId);

            await setDoc(docRef, {
                grupo: grupoSel,
                fecha: fecha,
                timestamp: Timestamp.fromDate(dateObj),
                presentes,
                ausentes,
                excusados,
                totalPresentes: presentes.length,
                totalAusentes: ausentes.length,
                totalExcusados: excusados.length,
                creadoPor: profile?.nombre || 'Admin',
                actualizadoEn: serverTimestamp()
            });

            setSuccessMsg("¡Asistencia guardada con éxito!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setError("Error al guardar asistencia: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;

        setIsDeleting(true);
        try {
            await AsistenciaService.deleteAsistencia(idToDelete);
            setSuccessMsg("Reporte eliminado correctamente");
            setTimeout(() => setSuccessMsg(''), 3000);

            // Si el reporte borrado es el que está cargado actualmente, resetear
            const docIdActual = `${grupoSel}_${fecha}`;
            if (idToDelete === docIdActual) {
                setAsistenciasMap({});
            }

            cargarHistorial();
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error("Error al eliminar:", err);
            setError("No se pudo eliminar el reporte");
        } finally {
            setIsDeleting(false);
            setIdToDelete(null);
        }
    };

    const rol = profile?.rol?.toLowerCase() || '';
    const esAdmin = profile?.isAdmin || rol === 'admin';
    const esPastor = rol === 'pastor';
    const esLider = rol === 'líder' || rol === 'lider';
    const tienePermisoEscritura = esAdmin || esPastor || esLider;
    const tienePermisoBorrado = esAdmin || esPastor; // Permitir a Admin y Pastor borrar

    const totalMiembros = todosLosMiembrosVisibles.length;
    const conteoPresentes = todosLosMiembrosVisibles.filter(m => asistenciasMap[m.id]?.estado === 'presente').length;
    const conteoExcusados = todosLosMiembrosVisibles.filter(m => asistenciasMap[m.id]?.estado === 'excusado').length;
    const conteoAusentes = totalMiembros - conteoPresentes - conteoExcusados;

    if (loadingMiembros) return (
        <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Preparando lista de asistencia...</p>
        </div>
    );

    if (!tienePermisoEscritura) return (
        <div className="bg-red-50 p-12 rounded-[3rem] text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900">Acceso Restringido</h2>
            <p className="text-slate-500 italic">No tienes permisos para gestionar asistencias.</p>
        </div>
    );



    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Registro de Asistencia</h1>
                    <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">
                        Selecciona la fecha y marca a los miembros presentes
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {successMsg && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 size={16} />
                            {successMsg}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || totalMiembros === 0}
                        className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>Guardar Reporte</span>
                    </button>
                </div>
            </div>

            {/* Controles Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm group focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <Calendar size={18} className="text-primary" />
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className="bg-transparent font-bold text-slate-700 text-sm outline-none w-full cursor-pointer"
                    />
                </div>

                {profile?.isAdmin && (
                    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm group focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                        <MapPin size={18} className="text-primary" />
                        <select
                            value={grupoSel}
                            onChange={e => setGrupoSel(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 text-sm outline-none w-full cursor-pointer"
                        >
                            <option value="">Seleccionar Grupo</option>
                            {listaGrupos.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-white border border-slate-100 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm font-medium text-slate-700 text-sm"
                    />
                </div>
            </div>

            {/* Resumen de Conteo - Grid Adaptativo */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:w-fit gap-3 md:gap-4">
                <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center ring-4 ring-green-500/5 shrink-0">
                        <UserCheck size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presentes</p>
                        <p className="text-lg md:text-2xl font-black text-slate-800">{conteoPresentes}</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center ring-4 ring-amber-500/5 shrink-0">
                        <AlertCircle size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Excusados</p>
                        <p className="text-lg md:text-2xl font-black text-slate-800">{conteoExcusados}</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-3 md:gap-4 col-span-2 md:col-span-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center ring-4 ring-red-500/5 shrink-0">
                        <UserX size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ausentes</p>
                        <p className="text-lg md:text-2xl font-black text-slate-800">{conteoAusentes}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-pulse">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {loadingReporte ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-50 shadow-sm animate-pulse">
                    <Loader2 size={32} className="text-primary animate-spin mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando datos del domingo...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todosLosMiembrosVisibles.length > 0 ? (
                        todosLosMiembrosVisibles.map((m) => {
                            const estado = asistenciasMap[m.id]?.estado || 'ausente';
                            const esExtra = m.esExtra;
                            return (
                                <div
                                    key={m.id}
                                    className={clsx(
                                        "relative bg-white rounded-[1.5rem] p-4 border transition-all group select-none overflow-hidden flex flex-col justify-between",
                                        estado === 'presente' && "border-green-100 ring-4 ring-green-500/5 shadow-xl shadow-green-100/40",
                                        estado === 'excusado' && "border-amber-100 ring-4 ring-amber-500/5 shadow-xl shadow-amber-100/40",
                                        estado === 'ausente' && "border-slate-50 shadow-sm",
                                        esExtra && "opacity-90"
                                    )}
                                >
                                    {esExtra && (
                                        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                                            Histórico / Externo
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors shrink-0 shadow-sm",
                                            estado === 'presente' ? "bg-green-500 text-white" :
                                                estado === 'excusado' ? "bg-amber-500 text-white" :
                                                    "bg-slate-100 text-slate-400"
                                        )}>
                                            {m.nombre?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx(
                                                "font-black text-[13px] truncate uppercase tracking-tight",
                                                estado === 'presente' ? "text-green-700" :
                                                    estado === 'excusado' ? "text-amber-700" :
                                                        "text-slate-700"
                                            )}>
                                                {m.nombre}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.grupo}</p>
                                        </div>
                                    </div>

                                    {/* Selector de estados optimizado */}
                                    <div className="flex gap-1.5 mb-3 p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <button
                                            onClick={() => setEstadoAsistencia(m.id, 'presente')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1",
                                                estado === 'presente' ? "bg-green-500 text-white shadow-md shadow-green-200" : "text-slate-400 hover:bg-white"
                                            )}
                                        >
                                            {estado === 'presente' && <CheckCircle2 size={10} />}
                                            Pres.
                                        </button>
                                        <button
                                            onClick={() => setEstadoAsistencia(m.id, 'excusado')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1",
                                                estado === 'excusado' ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "text-slate-400 hover:bg-white"
                                            )}
                                        >
                                            {estado === 'excusado' && <AlertCircle size={10} />}
                                            Exc.
                                        </button>
                                        <button
                                            onClick={() => setEstadoAsistencia(m.id, 'ausente')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1",
                                                estado === 'ausente' ? "bg-red-500 text-white shadow-md shadow-red-200" : "text-slate-400 hover:bg-white"
                                            )}
                                        >
                                            {estado === 'ausente' && <UserX size={10} />}
                                            Aus.
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <MessageSquare className="absolute left-2.5 top-2.5 text-slate-300" size={12} />
                                        <textarea
                                            placeholder="Nota rápida..."
                                            value={asistenciasMap[m.id]?.observacion || ''}
                                            onChange={e => setObservacion(m.id, e.target.value)}
                                            className="w-full bg-slate-50/30 border border-slate-100 rounded-lg pl-8 pr-3 py-2 text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all h-[40px] resize-none"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                            <Users size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No se encontraron miembros para este grupo</p>
                        </div>
                    )}
                </div>
            )}

            {/* Historial de Reportes */}
            {historialReciente.length > 0 && (
                <div className="mt-12 bg-white rounded-[2rem] p-8 border border-slate-50 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="text-primary" size={24} />
                        Historial de Reportes
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 custom-scrollbar snap-x">
                        {historialReciente.map((h) => {
                            const dateObj = new Date(h.fecha + 'T12:00:00');
                            const esFechaValida = !isNaN(dateObj.getTime());

                            if (!esFechaValida) return null;

                            return (
                                <button
                                    key={h.id}
                                    onClick={() => setFecha(h.fecha)}
                                    className={clsx(
                                        "relative flex flex-col items-center p-4 rounded-2xl border transition-all text-center group",
                                        fecha === h.fecha
                                            ? "bg-primary text-white border-primary shadow-lg shadow-blue-200"
                                            : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-primary/30"
                                    )}
                                >
                                    {/* Botón de Eliminar */}
                                    {tienePermisoBorrado && (
                                        <div
                                            onClick={(e) => handleDelete(e, h.id)}
                                            className={clsx(
                                                "absolute top-2 right-2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                                                fecha === h.fecha ? "hover:bg-white/20 text-white" : "hover:bg-red-50 text-red-400"
                                            )}
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    )}

                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest leading-none mb-1", fecha === h.fecha ? "text-blue-100" : "text-slate-400")}>
                                        {dateObj.toLocaleDateString('es-ES', { weekday: 'short' })}
                                    </span>
                                    <span className="text-lg font-black leading-none mb-2">{h.fecha.split('-')[2]}</span>
                                    <span className={clsx("text-[10px] font-bold uppercase", fecha === h.fecha ? "text-blue-50" : "text-slate-500")}>
                                        {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                                    </span>
                                    <div className={clsx(
                                        "mt-3 px-2 py-0.5 rounded-full text-[8px] font-black tracking-tighter uppercase whitespace-nowrap",
                                        fecha === h.fecha ? "bg-white/20 text-white" : "bg-green-100/50 text-green-600"
                                    )}>
                                        {h.totalPresentes} Presentes
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para eliminar */}
            <AlertDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                variant="danger"
                title="¿Eliminar reporte?"
                description="Esta acción eliminará permanentemente el registro de asistencia de este domingo. Los datos no podrán recuperarse."
                confirmText="Sí, eliminar reporte"
                cancelText="No, mantener"
            />
        </div>
    );
};

export default Asistencia;
