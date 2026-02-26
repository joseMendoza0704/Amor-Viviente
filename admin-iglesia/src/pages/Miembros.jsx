import React, { useState, useMemo } from 'react';
import { useMiembros } from '../hooks/useMiembros';
import { useAuth } from '../context/AuthContext';
import MiembroModal from '../components/Miembros/MiembroModal';
import AsistenciaModal from '../components/Miembros/AsistenciaModal';
import {
    Users,
    Search,
    Filter,
    UserPlus,
    MoreVertical,
    Phone,
    Calendar,
    AlertCircle,
    Edit2,
    CheckCircle2,
    XCircle,
    UserMinus,
    Crown,
    Wallet,
    HeartHandshake
} from 'lucide-react';

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

import { clsx } from 'clsx';

const AttendanceSquare = ({ item }) => {
    const { estado, dia } = item;
    const colors = {
        asistio: "bg-green-500 shadow-sm shadow-green-200 text-white",
        excusa: "bg-amber-400 shadow-sm shadow-amber-200 text-white",
        falto: "bg-red-500 shadow-sm shadow-red-200 text-white"
    };

    const tooltips = {
        asistio: "Asistió",
        excusa: "Justificó",
        falto: "Faltó"
    };

    return (
        <div
            title={`${tooltips[estado]} (Día ${dia})`}
            className={clsx(
                "w-5 h-5 rounded-sm transition-transform hover:scale-125 cursor-help flex items-center justify-center text-[8px] font-black",
                colors[estado] || "bg-slate-200 text-slate-400"
            )}
        >
            {dia}
        </div>
    );
};

const StatusPill = ({ status, colorClass }) => {
    const configs = {
        "Activo": "bg-green-50 text-green-600 border-green-100",
        "En consolidación": "bg-blue-50 text-blue-600 border-blue-100",
        "Requiere llamada": "bg-amber-50 text-amber-600 border-amber-100",
        "Requiere visita": "bg-red-50 text-red-600 border-red-100",
        "Baja / Inactivo": "bg-slate-50 text-slate-500 border-slate-100"
    };

    return (
        <span className={clsx(
            "px-4 py-2 rounded-full text-[11px] font-black border uppercase tracking-wider shadow-sm whitespace-nowrap",
            configs[status] || "bg-slate-50 text-slate-400 border-slate-100",
            status === "Requiere visita" && "animate-pulse"
        )}>
            {status}
        </span>
    );
};

const Miembros = () => {
    const { profile } = useAuth();
    const {
        miembros,
        loading,
        error,
        agregarMiembro,
        actualizarMiembro,
        desactivarMiembro,
        actualizarAsistenciaMiembro,
        asistencias,
        filtroMes,
        setFiltroMes,
        filtroGrupo,
        setFiltroGrupo,
        listaGrupos,
        rolesOcupados
    } = useMiembros();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Asistencia Modal State
    const [isAsistenciaModalOpen, setIsAsistenciaModalOpen] = useState(false);
    const [memberForAsistencia, setMemberForAsistencia] = useState(null);

    // Dropdown state
    const [openMenuId, setOpenMenuId] = useState(null);

    const filteredMiembros = useMemo(() => {
        return miembros.filter(m => {
            const matchesSearch = (m.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterStatus === 'todos' || m.estadoSeguimiento === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [miembros, searchTerm, filterStatus]);

    const handleCorreccionAsistencia = (miembro) => {
        setSelectedMember(miembro);
        setIsAsistenciaModalOpen(true);
    };

    // Separar servidores de congregantes
    const servidores = filteredMiembros.filter(m => m.rol && ['Líder', 'Asistente', 'Tesorero'].includes(m.rol));
    const congregantes = filteredMiembros.filter(m => !m.rol || !['Líder', 'Asistente', 'Tesorero'].includes(m.rol));

    const handleOpenCreate = () => {
        setSelectedMember(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleSave = async (formData) => {
        setActionLoading(true);
        try {
            if (selectedMember) {
                await actualizarMiembro(selectedMember.id, formData);
            } else {
                await agregarMiembro(formData);
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Error al guardar: " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (window.confirm("¿Estás seguro de dar de baja a este miembro? No se eliminará de la base de datos.")) {
            await desactivarMiembro(id);
            setOpenMenuId(null);
        }
    };

    const renderFilaMiembro = (miembro, isServidor) => (
        <tr
            key={miembro.id}
            onDoubleClick={() => handleOpenEdit(miembro)}
            className="hover:bg-blue-50/20 transition-all group cursor-pointer select-none"
        >
            <td className="px-10 py-8">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-100 shadow-sm group-hover:shadow-md transition-all uppercase text-sm">
                        {miembro.nombre.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-700 text-[16px] leading-tight group-hover:text-primary transition-colors">{miembro.nombre}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Phone size={11} className="text-slate-300" />
                                <p className="text-[12px] text-slate-400 font-medium leading-none">{miembro.telefono || 'Sin tel'}</p>
                            </div>
                            {miembro.rol && miembro.rol !== 'Congregante' && miembro.rol !== '' && (
                                <div className={clsx(
                                    "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                    miembro.rol === 'Líder' && "bg-amber-50 text-amber-600 border border-amber-100",
                                    miembro.rol === 'Asistente' && "bg-blue-50  text-blue-600  border border-blue-100",
                                    miembro.rol === 'Tesorero' && "bg-green-50 text-green-600 border border-green-100"
                                )}>
                                    {miembro.rol === 'Líder' && <Crown size={9} />}
                                    {miembro.rol === 'Asistente' && <HeartHandshake size={9} />}
                                    {miembro.rol === 'Tesorero' && <Wallet size={9} />}
                                    {miembro.rol}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-10 py-8">
                <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-slate-600 leading-none">{miembro.grupo}</span>
                </div>
            </td>
            <td className="px-10 py-8 text-center">
                <div className="flex gap-1.5 items-center justify-center">
                    {miembro.historialAsistencia?.map((item, id) => (
                        <AttendanceSquare key={id} item={item} />
                    ))}
                </div>
            </td>
            <td className="px-10 py-8">
                <div className="flex justify-start">
                    <StatusPill status={miembro.estadoSeguimiento} />
                </div>
            </td>
            <td className="px-10 py-8 border-l border-slate-50/50 text-center relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === miembro.id ? null : miembro.id);
                    }}
                    className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                    <MoreVertical size={20} />
                </button>

                {/* Dropdown Menu Unificado */}
                {openMenuId === miembro.id && (
                    <div className="absolute right-10 top-16 z-[70] bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[220px] animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => handleOpenEdit(miembro)}
                            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-left"
                        >
                            <Edit2 size={18} className="text-blue-500" />
                            Editar Perfil
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMemberForAsistencia(miembro);
                                setIsAsistenciaModalOpen(true);
                                setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-left"
                        >
                            <CheckCircle2 size={18} className="text-green-500" />
                            Corregir Asistencia
                        </button>
                        <div className="my-1.5 border-t border-slate-50" />
                        <button
                            onClick={() => handleDeactivate(miembro.id)}
                            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left"
                        >
                            <UserMinus size={18} />
                            Dar de baja
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Cargando directorio de miembros...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[3rem] p-12 text-center max-w-2xl mx-auto shadow-2xl shadow-red-200/20">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-4">Error de Conexión</h2>
            <p className="text-slate-600 mb-8 italic">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs">
                Reintentar
            </button>
        </div>
    );

    if (!profile?.grupoAsignado) return (
        <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-12 text-center max-w-2xl mx-auto shadow-2xl shadow-amber-200/20">
            <Users size={48} className="text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-4">Sin Grupo Asignado</h2>
            <p className="text-slate-600 mb-8 font-medium">Contacta al administrador para que asigne tu grupo en la base de datos.</p>
        </div>
    );

    return (
        <div className="space-y-10" onClick={() => setOpenMenuId(null)}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Directorio CRM</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gestionando:</p>
                        {listaGrupos.length > 1 || profile?.isAdmin ? (
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
                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                    <UserPlus size={18} />
                    <span>Nuevo Miembro</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative md:col-span-2 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-white border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-xl shadow-slate-200/30 font-medium text-slate-700"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-3xl appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 border-primary/10 transition-all shadow-xl shadow-slate-200/30 font-bold text-slate-500 uppercase tracking-widest text-[10px]"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="Activo">Activo</option>
                        <option value="En consolidación">En consolidación</option>
                        <option value="Requiere visita">Requiere visita</option>
                        <option value="Requiere llamada">Requiere llamada</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Servidores (Líder, Asistente, Tesorero) */}
            {servidores.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Crown className="text-amber-500" size={24} />
                        Servidores del Grupo
                    </h3>
                    <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-amber-50/50 border-b border-amber-100">
                                        <th className="px-10 py-5 text-[11px] font-black text-amber-700/60 uppercase tracking-[0.2em]">Servidor</th>
                                        <th className="px-10 py-5 text-[11px] font-black text-amber-700/60 uppercase tracking-[0.2em]">Tribu / Grupo</th>
                                        <th className="px-10 py-5 text-[11px] font-black text-amber-700/60 uppercase tracking-[0.2em] min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <span>Asistencia</span>
                                                <select
                                                    value={filtroMes}
                                                    onChange={(e) => setFiltroMes(parseInt(e.target.value))}
                                                    className="bg-amber-100/50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border-none outline-none text-amber-700 cursor-pointer lowercase first-letter:uppercase transition-all font-black text-[11px]"
                                                >
                                                    {MESES.map((mes, idx) => (
                                                        <option key={idx} value={idx}>{mes}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </th>
                                        <th className="px-10 py-5 text-[11px] font-black text-amber-700/60 uppercase tracking-[0.2em]">Estado</th>
                                        <th className="w-20 px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {servidores.map((miembro) => renderFilaMiembro(miembro, true))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla Principal de Congregantes */}
            <div>
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Users className="text-primary" size={24} />
                    Congregantes
                </h3>
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/40 border-b border-slate-100">
                                    <th className="px-10 py-7 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Miembro</th>
                                    <th className="px-10 py-7 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Tribu / Grupo</th>
                                    <th className="px-10 py-7 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <span>Asistencia</span>
                                            <select
                                                value={filtroMes}
                                                onChange={(e) => setFiltroMes(parseInt(e.target.value))}
                                                className="bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border-none outline-none text-primary cursor-pointer lowercase first-letter:uppercase transition-all font-black text-[11px]"
                                            >
                                                {MESES.map((mes, idx) => (
                                                    <option key={idx} value={idx}>{mes}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-10 py-7 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>

                                    <th className="px-10 py-7 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/50">
                                {congregantes.length > 0 ? (
                                    congregantes.map((miembro) => renderFilaMiembro(miembro, false))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <Users size={32} className="text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-medium">No se encontraron congregantes</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal CRUD */}
                <MiembroModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    member={selectedMember}
                    loading={actionLoading}
                    rolesOcupados={rolesOcupados}
                />

                {/* Modal de Asistencia */}
                <AsistenciaModal
                    isOpen={isAsistenciaModalOpen}
                    onClose={() => setIsAsistenciaModalOpen(false)}
                    member={memberForAsistencia}
                    asistencias={asistencias}
                    onUpdateMemberAsistencia={actualizarAsistenciaMiembro}
                />
            </div>
        </div>
    );
};

export default Miembros;
