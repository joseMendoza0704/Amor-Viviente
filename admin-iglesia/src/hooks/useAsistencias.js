import { useState, useEffect, useCallback } from "react";
import AsistenciaService from "../services/AsistenciaService";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gestionar los registros de asistencia del grupo.
 */
export const useAsistencias = (grupo = '', mes = null, anio = null) => {
    const { profile } = useAuth();
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarAsistencias = useCallback(async () => {
        // Priorizar el grupo pasado por parámetro, si no, usar el del perfil
        const grupoABuscar = grupo || profile?.grupoAsignado;
        if (!grupoABuscar && !profile?.isAdmin) return;

        setLoading(true);
        setError(null);
        try {
            let data;
            // Si hay mes y año, usamos la consulta específica del mes
            if (mes !== null && anio !== null) {
                data = await AsistenciaService.getAsistenciasPorMes(grupoABuscar, mes, anio);
            } else {
                // De lo contrario, traemos las últimas asistencias generales
                data = await AsistenciaService.getAsistenciasPorGrupo(grupoABuscar);
            }
            setAsistencias(data);
        } catch (err) {
            console.error("Error cargando asistencias:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [grupo, mes, anio, profile?.grupoAsignado, profile?.isAdmin]);

    useEffect(() => {
        cargarAsistencias();
    }, [cargarAsistencias]);

    return {
        asistencias,
        loading,
        error,
        refresh: cargarAsistencias
    };
};
