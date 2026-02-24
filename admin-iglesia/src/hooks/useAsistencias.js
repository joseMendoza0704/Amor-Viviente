import { useState, useEffect, useCallback } from "react";
import AsistenciaService from "../services/AsistenciaService";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para gestionar los registros de asistencia del grupo.
 */
export const useAsistencias = () => {
    const { profile } = useAuth();
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarAsistencias = useCallback(async () => {
        if (!profile?.grupoAsignado) return;

        setLoading(true);
        setError(null);
        try {
            const data = await AsistenciaService.getAsistenciasPorGrupo(profile.grupoAsignado);
            setAsistencias(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.grupoAsignado]);

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
