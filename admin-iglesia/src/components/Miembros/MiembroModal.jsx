import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MessageSquare, Info } from 'lucide-react';
import { clsx } from 'clsx';

const MiembroModal = ({ isOpen, onClose, onSave, member, loading }) => {
    const initialState = {
        nombre: '',
        telefono: '',
        estadoSeguimiento: 'En consolidación',
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
                activo: member.activo ?? true,
                notasPastorales: member.notasPastorales || ''
            });
        } else {
            setFormData(initialState);
        }
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nombre.trim()) {
            setError('El nombre completo es obligatorio.');
            return;
        }

        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 translate-z-0">
            <div className="absolute inset-0 bg-slate-900/40 transition-opacity" onClick={onClose} />

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
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100 italic">
                            <Info size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
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

                        {/* Estado y Toggle */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Seguimiento</label>
                                <select
                                    value={formData.estadoSeguimiento}
                                    onChange={(e) => setFormData({ ...formData, estadoSeguimiento: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700"
                                >
                                    <option value="Al día">Al día</option>
                                    <option value="En consolidación">En consolidación</option>
                                    <option value="Requiere visita">Requiere visita</option>
                                    <option value="Requiere llamada">Requiere llamada</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado</label>
                                <div
                                    onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                    className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer"
                                >
                                    <span className={clsx("text-sm font-bold", formData.activo ? "text-green-600" : "text-slate-400")}>
                                        {formData.activo ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                    <div className={clsx(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        formData.activo ? "bg-green-500" : "bg-slate-300"
                                    )}>
                                        <div className={clsx(
                                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                            formData.activo ? "translate-x-6" : "translate-x-1"
                                        )} />
                                    </div>
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
