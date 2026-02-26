import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, User, Phone, MessageSquare, Info, Crown, Wallet, HeartHandshake, Users } from 'lucide-react';
import { clsx } from 'clsx';

// Roles únicos en el grupo (solo puede haber uno de cada uno)
const ROLES_UNICOS = ['Líder', 'Asistente', 'Tesorero'];

const ROL_CONFIG = {
    'Congregante': { icon: Users, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', label: 'Congregante', desc: 'Miembro regular' },
    'Líder': { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Líder', desc: 'Solo uno por grupo' },
    'Asistente': { icon: HeartHandshake, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Asistente', desc: 'Solo uno por grupo' },
    'Tesorero': { icon: Wallet, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', label: 'Tesorero', desc: 'Solo uno por grupo' },
};

const MiembroModal = ({ isOpen, onClose, onSave, member, loading, rolesOcupados = {} }) => {
    const initialState = {
        nombre: '',
        telefono: '',
        estadoSeguimiento: 'En consolidación',
        rol: 'Congregante',
        activo: true,
        notasPastorales: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [error, setError] = useState('');

    useEffect(() => {
        if (member) {
            setFormData({
                nombre: member.nombre || '',
                telefono: member.telefono || '',
                estadoSeguimiento: member.estadoSeguimiento || 'En consolidación',
                // Normalizar: '' o undefined → 'Congregante'
                rol: member.rol && member.rol !== '' ? member.rol : 'Congregante',
                activo: member.activo ?? true,
                notasPastorales: member.notasPastorales || ''
            });
        } else {
            setFormData(initialState);
        }
        setError('');
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nombre.trim()) {
            setError('El nombre completo es obligatorio.');
            return;
        }

        // Validar unicidad: si el rol seleccionado es único y ya está ocupado por OTRO miembro
        const rolSeleccionado = formData.rol;
        if (ROLES_UNICOS.includes(rolSeleccionado)) {
            const ocupadoPor = rolesOcupados[rolSeleccionado];
            // ocupadoPor es el nombre del miembro que ya tiene ese rol
            // Si está ocupado y NO es el miembro que estamos editando, bloquear
            if (ocupadoPor && ocupadoPor !== member?.nombre) {
                setError(`El rol "${rolSeleccionado}" ya está asignado a ${ocupadoPor} en este grupo.`);
                return;
            }
        }

        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-150">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {member ? 'Editar Miembro' : 'Nuevo Miembro'}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Completa la información del miembro</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100">
                            <Info size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium"
                                    placeholder="+504 0000-0000"
                                />
                            </div>
                        </div>

                        {/* Rol en el Grupo */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                Rol en el Grupo
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {Object.entries(ROL_CONFIG).map(([rol, cfg]) => {
                                    const Icon = cfg.icon;
                                    const isSelected = formData.rol === rol;
                                    // Rol ocupado por OTRO miembro
                                    const ocupadoPor = rolesOcupados[rol];
                                    const estaOcupado = ROLES_UNICOS.includes(rol) && ocupadoPor && ocupadoPor !== member?.nombre;

                                    return (
                                        <button
                                            key={rol}
                                            type="button"
                                            disabled={estaOcupado}
                                            onClick={() => !estaOcupado && setFormData({ ...formData, rol })}
                                            title={estaOcupado ? `Ocupado por: ${ocupadoPor}` : ''}
                                            className={clsx(
                                                "relative p-4 rounded-2xl border text-left transition-all",
                                                isSelected
                                                    ? `${cfg.bg} ${cfg.border} shadow-sm`
                                                    : estaOcupado
                                                        ? "bg-slate-50/50 border-slate-100 opacity-40 cursor-not-allowed"
                                                        : "bg-slate-50 border-slate-100 hover:border-slate-200 cursor-pointer"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon size={18} className={isSelected ? cfg.color : 'text-slate-300'} />
                                                <div>
                                                    <p className={clsx("font-black text-sm", isSelected ? cfg.color : 'text-slate-500')}>
                                                        {cfg.label}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {estaOcupado ? `→ ${ocupadoPor}` : cfg.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Seguimiento */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado de Seguimiento</label>
                            <select
                                value={formData.estadoSeguimiento}
                                onChange={(e) => setFormData({ ...formData, estadoSeguimiento: e.target.value })}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700"
                            >
                                <option value="Activo">Activo</option>
                                <option value="En consolidación">En consolidación</option>
                                <option value="Requiere visita">Requiere visita</option>
                                <option value="Requiere llamada">Requiere llamada</option>
                            </select>
                        </div>

                        {/* Estado Administrativo */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado Administrativo</label>
                            <div
                                onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                className="flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <span className={clsx("text-sm font-black tracking-widest", formData.activo ? "text-green-600" : "text-slate-400")}>
                                    {formData.activo ? 'VIGENTE / ACTIVO' : 'DADO DE BAJA'}
                                </span>
                                <div className={clsx("w-12 h-6 rounded-full transition-colors relative", formData.activo ? "bg-green-500" : "bg-slate-300")}>
                                    <div className={clsx("absolute top-1.5 w-3 h-3 bg-white rounded-full transition-transform", formData.activo ? "translate-x-7" : "translate-x-1.5")} />
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Notas Pastorales</label>
                            <div className="relative group">
                                <MessageSquare className="absolute left-4 top-4 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                                <textarea
                                    value={formData.notasPastorales}
                                    onChange={(e) => setFormData({ ...formData, notasPastorales: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-medium min-h-[100px]"
                                    placeholder="Detalles del seguimiento..."
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-8 bg-slate-50/50 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                <span>{member ? 'Guardar Cambios' : 'Crear Miembro'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiembroModal;
