import React from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const VARIANTS = {
    danger: {
        bg: 'bg-red-50',
        border: 'border-red-100',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        title: 'text-red-900',
        description: 'text-red-700/80',
        btnConfirm: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 focus:ring-red-500',
        icon: AlertTriangle
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-600',
        title: 'text-amber-900',
        description: 'text-amber-700/80',
        btnConfirm: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 focus:ring-amber-500',
        icon: AlertCircle
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        title: 'text-blue-900',
        description: 'text-blue-700/80',
        btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 focus:ring-blue-500',
        icon: Info
    }
};

/**
 * Componente modal de alerta / confirmación reutilizable
 * @param {boolean} isOpen - Controla la visibilidad
 * @param {function} onClose - Ejecutado al cancelar o cerrar
 * @param {function} onConfirm - Ejecutado al aceptar
 * @param {string} title - Título del modal
 * @param {string} description - Mensaje principal
 * @param {string} confirmText - Texto del botón de confirmación (ej: 'Eliminar', 'Aceptar')
 * @param {string} cancelText - Texto del botón cancelar
 * @param {string} variant - 'danger' | 'warning' | 'info'
 * @param {boolean} isLoading - Deshabilita los botones y muestra estado de carga en el confirm
 */
const AlertDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Continuar',
    cancelText = 'Cancelar',
    variant = 'warning',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const styles = VARIANTS[variant] || VARIANTS.warning;
    const Icon = styles.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Dialog */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border",
                    styles.border
                )}
            >
                {/* Header decorativo superior */}
                <div className={cn("h-32 absolute top-0 left-0 right-0 w-full opacity-50", styles.bg)} />

                <div className="relative pt-8 px-6 pb-6">
                    {/* Botón Cerrar (X) */}
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}

                    {/* Contenido (Icono + Textos) */}
                    <div className="flex flex-col items-center text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-5 rotate-3", styles.iconBg, styles.iconText)}>
                            <Icon size={32} />
                        </div>

                        <h3 className={cn("text-xl font-black mb-2", styles.title)}>
                            {title}
                        </h3>

                        <p className={cn("text-sm font-medium leading-relaxed mb-8 px-4", styles.description)}>
                            {description}
                        </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:px-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {cancelText}
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 px-4 py-3 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2",
                                styles.btnConfirm
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cargando...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertDialog;
