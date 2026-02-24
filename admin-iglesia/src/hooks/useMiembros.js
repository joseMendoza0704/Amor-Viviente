import { useState, useEffect, useCallback, useMemo } from 'react';
import MiembrosService from '../services/MiembrosService';
import AsistenciaService from '../services/AsistenciaService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para gestionar los miembros y su lógica de negocio (CRM).
 */
export const useMiembros = () => {
    const { profile } = useAuth();
    const [miembros, setMiembros] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado del mes seleccionado para el filtro
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth());
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        if (!profile?.grupoAsignado) return;

        setLoading(true);
        setError(null);
        try {
            // Cargar miembros y asistencias del mes seleccionado en paralelo
            const [miembrosData, asistenciasData] = await Promise.all([
                MiembrosService.getMiembrosPorGrupo(profile.grupoAsignado),
                AsistenciaService.getAsistenciasPorMes(profile.grupoAsignado, filtroMes, filtroAnio)
            ]);

            setMiembros(miembrosData);
            setAsistencias(asistenciasData);
        } catch (err) {
            console.error("useMiembros Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.grupoAsignado, filtroMes, filtroAnio]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Lógica para procesar la asistencia de los miembros
    const miembrosConAsistencia = useMemo(() => {
        return miembros.map(m => {
            const historialAsistencia = asistencias.map(asist => {
                // Obtener el día del mes del timestamp
                let dia = null;
                if (asist.timestamp) {
                    const date = asist.timestamp.toDate ? asist.timestamp.toDate() : new Date(asist.timestamp);
                    dia = date.getDate();
                }

                // Determinar estado
                let estado = 'falto';
                if (asist.miembros?.includes(m.nombre)) estado = 'asistio';
                else if (asist.justificados?.includes(m.nombre)) estado = 'excusa';

                return { estado, dia };
            });

            // Calcular inasistencias consecutivas (de más reciente a más antigua)
            let inasistenciasSeguidas = 0;
            for (let i = historialAsistencia.length - 1; i >= 0; i--) {
                if (historialAsistencia[i].estado === 'falto') {
                    inasistenciasSeguidas++;
                } else {
                    break;
                }
            }

            // Determinar estado de seguimiento (Normalizar "si" a "Activo")
            let rawEstado = m.estadoSeguimiento;
            if (rawEstado === "si" || !rawEstado) rawEstado = "Activo";

            let estadoSeguimiento = rawEstado;
            let colorEstado = "bg-green-500"; // Default: Activo

            // La lógica de inasistencias sobreescribe el estado si es crítica
            if (inasistenciasSeguidas >= 3) {
                estadoSeguimiento = "Requiere visita"; // Antes llamada
                colorEstado = "bg-red-500 animate-pulse";
            } else if (inasistenciasSeguidas === 2) {
                estadoSeguimiento = "Requiere llamada"; // Antes visita
                colorEstado = "bg-amber-400";
            } else if (estadoSeguimiento === "En consolidación") {
                colorEstado = "bg-blue-400";
            } else if (estadoSeguimiento === "Requiere visita" || estadoSeguimiento === "Activo") {
                colorEstado = estadoSeguimiento === "Activo" ? "bg-green-500" : "bg-red-500";
            } else if (estadoSeguimiento === "Requiere llamada") {
                colorEstado = "bg-amber-400";
            }

            // Si está inactivo administrativemente, gris tiene prioridad
            if (m.activo === false) {
                colorEstado = "bg-slate-400";
                estadoSeguimiento = "Baja / Inactivo";
            }

            return {
                ...m,
                historialAsistencia,
                inasistenciasSeguidas,
                estadoSeguimiento,
                colorEstado
            };
        });
    }, [miembros, asistencias]);

    const agregarMiembro = async (data) => {
        const id = await MiembrosService.agregarMiembro({
            ...data,
            grupo: profile.grupoAsignado
        });
        await fetchData();
        return id;
    };

    const actualizarMiembro = async (id, data) => {
        await MiembrosService.actualizarMiembro(id, data);
        await fetchData();
    };

    const desactivarMiembro = async (id) => {
        await MiembrosService.desactivarMiembro(id);
        await fetchData();
    };

    const actualizarAsistenciaMiembro = async (asistenciaId, miembroNombre, nuevoEstado) => {
        const asist = asistencias.find(a => a.id === asistenciaId);
        if (!asist) return;

        let nuevosMiembros = [...(asist.miembros || [])];
        let nuevasExcusas = [...(asist.justificados || [])];

        // Limpiar de ambos primero
        nuevosMiembros = nuevosMiembros.filter(n => n !== miembroNombre);
        nuevasExcusas = nuevasExcusas.filter(n => n !== miembroNombre);

        // Agregar según el nuevo estado
        if (nuevoEstado === 'asistio') nuevosMiembros.push(miembroNombre);
        else if (nuevoEstado === 'excusa') nuevasExcusas.push(miembroNombre);

        await AsistenciaService.updateAsistencia(asistenciaId, {
            miembros: nuevosMiembros,
            justificados: nuevasExcusas
        });

        await fetchData();
    };

    return {
        miembros: miembrosConAsistencia,
        asistencias, // Exponer asistencias crudas para el modal de corrección
        filtroMes,
        filtroAnio,
        setFiltroMes,
        setFiltroAnio,
        loading,
        error,
        agregarMiembro,
        actualizarMiembro,
        desactivarMiembro,
        actualizarAsistenciaMiembro,
        refresh: fetchData
    };
};
