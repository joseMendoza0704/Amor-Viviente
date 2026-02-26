import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import MiembrosService from '../services/MiembrosService';
import {
    UserCog,
    UserPlus,
    Search,
    Shield,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CheckSquare,
    Square,
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Modal para crear un nuevo usuario ─────────────────────────────────────────
const NuevoUsuarioModal = ({ isOpen, onClose, onSave, loading }) => {
    const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'lider' });
    const [showPassword, setShowPassword] = useState(false);
    const [errores, setErrores] = useState({});

    // Resetear al abrir
    useEffect(() => {
        if (isOpen) {
            setForm({ nombre: '', correo: '', password: '', rol: 'lider' });
            setErrores({});
            setShowPassword(false);
        }
    }, [isOpen]);

    const validar = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
        if (!form.correo.trim()) e.correo = 'El correo es requerido';
        else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Correo no válido';
        if (!form.password) e.password = 'La contraseña es requerida';
        else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const e2 = validar();
        if (Object.keys(e2).length > 0) { setErrores(e2); return; }
        onSave(form);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-10 pt-10 pb-6 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Nuevo Usuario</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Crea una cuenta que funciona con el login
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-10 py-8 space-y-5">
                    {/* Nombre */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                            placeholder="Ej: Juan Pérez"
                            className={clsx(
                                "w-full px-5 py-3.5 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 text-sm",
                                errores.nombre ? "border-red-300" : "border-slate-100 focus:border-primary"
                            )}
                        />
                        {errores.nombre && <p className="text-red-500 text-[11px] font-bold mt-1.5">{errores.nombre}</p>}
                    </div>

                    {/* Correo */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={form.correo}
                            onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
                            placeholder="usuario@ejemplo.com"
                            className={clsx(
                                "w-full px-5 py-3.5 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 text-sm",
                                errores.correo ? "border-red-300" : "border-slate-100 focus:border-primary"
                            )}
                        />
                        {errores.correo && <p className="text-red-500 text-[11px] font-bold mt-1.5">{errores.correo}</p>}
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Contraseña Inicial
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="Mínimo 6 caracteres"
                                className={clsx(
                                    "w-full px-5 py-3.5 pr-12 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-700 text-sm",
                                    errores.password ? "border-red-300" : "border-slate-100 focus:border-primary"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errores.password && <p className="text-red-500 text-[11px] font-bold mt-1.5">{errores.password}</p>}
                    </div>

                    {/* Rol */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Rol
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'lider', label: '👤 Líder', desc: 'Acceso a sus grupos' },
                                { value: 'pastor', label: '📖 Pastor', desc: 'Acceso total a datos' },
                                { value: 'admin', label: '🛡️ Admin', desc: 'Configuración total' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, rol: opt.value }))}
                                    className={clsx(
                                        "p-4 rounded-2xl border text-left transition-all",
                                        form.rol === opt.value
                                            ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                                            : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
                                    )}
                                >
                                    <p className="font-black text-sm">{opt.label}</p>
                                    <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Página principal ───────────────────────────────────────────────────────────
const Usuarios = () => {
    const { isAdmin, user: currentUser, refreshProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [updatingId, setUpdatingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Modal nuevo usuario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [usersData, gruposData] = await Promise.all([
                AuthService.getAllUsers(),
                MiembrosService.getTodosLosGrupos()
            ]);
            setUsers(usersData);
            setGrupos(gruposData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCrearUsuario = async (formData) => {
        setCreatingUser(true);
        setError(null);
        try {
            await AuthService.crearUsuario(formData.correo, formData.password, {
                nombre: formData.nombre,
                rol: formData.rol
            });
            setIsModalOpen(false);
            showSuccess('Usuario creado exitosamente');
            await fetchInitialData(); // Refrescar lista
        } catch (err) {
            setError('Error al crear usuario: ' + err.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const toggleGroupAccess = async (user, grupo) => {
        setUpdatingId(`${user.uid}-${grupo}`);
        setError(null);

        try {
            const currentLista = user.listaGrupos || (user.grupoAsignado ? [user.grupoAsignado] : []);
            let nuevaLista;

            if (currentLista.includes(grupo)) {
                nuevaLista = currentLista.filter(g => g !== grupo);
            } else {
                nuevaLista = [...currentLista, grupo];
            }

            await AuthService.updateUserProfile(user.uid, {
                listaGrupos: nuevaLista,
                grupoAsignado: nuevaLista.length > 0 ? nuevaLista[0] : ""
            });

            setUsers(prev => prev.map(u =>
                u.uid === user.uid ? { ...u, listaGrupos: nuevaLista, grupoAsignado: nuevaLista.length > 0 ? nuevaLista[0] : "" } : u
            ));

            if (user.uid === currentUser?.uid) {
                await refreshProfile();
            }

            showSuccess('Permisos actualizados');
        } catch (err) {
            setError('Error al actualizar: ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const filteredUsers = users.filter(u =>
        (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.correo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) return (
        <div className="bg-red-50 p-12 rounded-[3rem] text-center">
            <Shield size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900">Acceso Restringido</h2>
            <p className="text-slate-500 italic">Solo los administradores pueden gestionar usuarios.</p>
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium italic">Cargando gestión de usuarios...</p>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Acceso</h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">
                        Crea usuarios y asigna grupos a cada líder
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {successMessage && (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs animate-in fade-in slide-in-from-right-4">
                            <CheckCircle2 size={16} />
                            {successMessage}
                        </div>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-3 bg-primary text-white px-7 py-3.5 rounded-2xl font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                        <UserPlus size={16} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Alertas */}
            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Buscador */}
            <div className="relative group max-w-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar líder por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-white border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-xl shadow-slate-200/30 font-medium text-slate-700"
                />
            </div>

            {/* Contador */}
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest -mt-4">
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </p>

            {/* Grid de Usuarios */}
            <div className="grid grid-cols-1 gap-8">
                {filteredUsers.map((user) => (
                    <div
                        key={user.uid}
                        className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all"
                    >
                        <div className="flex flex-col xl:flex-row gap-8">
                            {/* Info de Usuario */}
                            <div className="xl:w-1/3 flex items-start gap-6 border-b xl:border-b-0 xl:border-r border-slate-50 pb-6 xl:pb-0 xl:pr-8">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                    <UserCog size={32} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl font-black text-slate-900 leading-none truncate mb-2">{user.nombre || 'Sin nombre'}</h3>
                                    <p className="text-slate-400 text-xs font-bold truncate mb-4 uppercase tracking-tighter">{user.correo}</p>
                                    <span className={clsx(
                                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                                        user.rol === 'admin' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            user.rol === 'pastor' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                        {user.rol || 'Líder'}
                                    </span>
                                </div>
                            </div>

                            {/* Checklist de Grupos */}
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block ml-1">
                                    Grupos con acceso:
                                </label>
                                {grupos.length === 0 ? (
                                    <p className="text-slate-300 text-sm italic font-medium">No hay grupos registrados en el sistema.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {grupos.map((grupo) => {
                                            const isAssigned = (user.listaGrupos || (user.grupoAsignado ? [user.grupoAsignado] : [])).includes(grupo);
                                            const isUpdating = updatingId === `${user.uid}-${grupo}`;

                                            return (
                                                <button
                                                    key={grupo}
                                                    disabled={!!updatingId}
                                                    onClick={() => toggleGroupAccess(user, grupo)}
                                                    className={clsx(
                                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/btn",
                                                        isAssigned
                                                            ? "bg-primary/5 border-primary/20 text-primary shadow-sm"
                                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-primary/20"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isAssigned ? (
                                                            <CheckSquare size={18} className="shrink-0" />
                                                        ) : (
                                                            <Square size={18} className="shrink-0 opacity-20 group-hover/btn:opacity-50" />
                                                        )}
                                                        <span className="text-[13px] font-bold leading-none truncate">{grupo}</span>
                                                    </div>
                                                    {isUpdating && <Loader2 size={14} className="animate-spin text-primary" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="py-32 text-center opacity-30 italic font-black uppercase tracking-[0.5em] text-slate-400">
                        No se encontraron usuarios
                    </div>
                )}
            </div>

            {/* Modal de Creación */}
            <NuevoUsuarioModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setError(null); }}
                onSave={handleCrearUsuario}
                loading={creatingUser}
            />
        </div>
    );
};

export default Usuarios;
