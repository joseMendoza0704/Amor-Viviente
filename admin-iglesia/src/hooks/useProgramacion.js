import { useState, useEffect, useCallback } from "react";
import ProgramacionService from "../services/ProgramacionService";
import MiembrosService from "../services/MiembrosService";
import { useAuth } from "../context/AuthContext";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Hook para gestionar la programación mensual de reuniones.
 */
export const useProgramacion = () => {
    const { profile } = useAuth();
    const hoy = new Date();

    const [mes, setMes] = useState(hoy.getMonth());
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [grupo, setGrupo] = useState('');
    const [listaGrupos, setListaGrupos] = useState([]);
    const [programacion, setProgramacion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Detectar grupo del perfil
    useEffect(() => {
        if (profile?.grupoAsignado && !grupo) {
            setGrupo(profile.grupoAsignado);
        } else if (profile?.listaGrupos?.length > 0 && !grupo) {
            setGrupo(profile.listaGrupos[0]);
        }
    }, [profile]);

    const cargar = useCallback(async () => {
        // Precargar la lista de grupos permitida
        if (profile?.isAdmin) {
            try {
                const todos = await MiembrosService.getTodosLosGrupos();
                const adminGrupos = new Set([
                    ...(profile?.listaGrupos || []),
                    ...(todos || [])
                ]);
                if (profile?.grupoAsignado) adminGrupos.add(profile.grupoAsignado);
                setListaGrupos(Array.from(adminGrupos).filter(Boolean).sort());
            } catch (err) {
                console.error("Error al cargar grupos:", err);
            }
        } else {
            const perfilGrupos = new Set(profile?.listaGrupos || []);
            if (profile?.grupoAsignado) perfilGrupos.add(profile.grupoAsignado);
            setListaGrupos(Array.from(perfilGrupos).filter(Boolean).sort());
        }

        if (!grupo) return;
        setLoading(true);
        setError(null);
        try {
            const data = await ProgramacionService.getProgramacion(grupo, anio, mes);
            setProgramacion(data);
        } catch (err) {
            console.error("useProgramacion error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [grupo, anio, mes]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    /**
     * Asignar o quitar actividad a un miembro en una reunión.
     * @param {number} reunionIdx - índice del domingo
     * @param {string} actividad - nombre de la actividad
     * @param {string|null} nombreMiembro - nombre del miembro o null para quitar
     */
    const asignarActividad = async (reunionIdx, actividad, nombreMiembro) => {
        if (!programacion) return;

        const nuevasReuniones = programacion.reuniones.map((r, idx) => {
            if (idx !== reunionIdx) return r;
            const nuevasParticipaciones = { ...r.participaciones };
            // Formato guardado en Firestore: { "Bienvenida": "Juan Pérez", "Alabanza": "María" }
            if (nombreMiembro === null || nombreMiembro === '') {
                delete nuevasParticipaciones[actividad];
            } else {
                nuevasParticipaciones[actividad] = nombreMiembro;
            }
            return { ...r, participaciones: nuevasParticipaciones };
        });

        // Actualizar localmente de inmediato (optimistic update)
        setProgramacion(prev => ({ ...prev, reuniones: nuevasReuniones }));

        // Guardar en Firestore
        setSaving(true);
        try {
            await ProgramacionService.guardarProgramacion(grupo, anio, mes, nuevasReuniones);
        } catch (err) {
            setError("Error al guardar: " + err.message);
            // Revertir en caso de error
            await cargar();
        } finally {
            setSaving(false);
        }
    };

    /**
     * Rellena toda la programación del mes de forma aleatoria intentando
     * usar a todos los miembros antes de repetir.
     */
    const generarProgramacionAleatoria = async (nombresMiembros) => {
        if (!programacion || !nombresMiembros || nombresMiembros.length === 0) return;

        // Crear una copia mezclada (Fisher-Yates) para el "pool" inicial
        const shuffleArray = (arr) => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        };

        let pool = shuffleArray(nombresMiembros);
        const getSiguienteMiembro = () => {
            if (pool.length === 0) {
                // Si ya usamos todos, volvemos a mezclar y llenamos el pool
                pool = shuffleArray(nombresMiembros);
            }
            return pool.pop();
        };

        const nuevasReuniones = programacion.reuniones.map(r => {
            const nuevasParticipaciones = {};
            // Para cada domingo, recorrer las actividades
            programacion.actividades.forEach(actividad => {
                nuevasParticipaciones[actividad] = getSiguienteMiembro();
            });
            return { ...r, participaciones: nuevasParticipaciones };
        });

        // Actualizar local
        setProgramacion(prev => ({ ...prev, reuniones: nuevasReuniones }));

        // Guardar en Firestore
        setSaving(true);
        try {
            await ProgramacionService.guardarProgramacion(grupo, anio, mes, nuevasReuniones);
        } catch (err) {
            setError("Error al guardar programación generada: " + err.message);
            await cargar();
        } finally {
            setSaving(false);
        }
    };

    return {
        // Estado de navegación
        mes, setMes,
        anio, setAnio,
        grupo, setGrupo,
        listaGrupos,
        isAdmin: profile?.isAdmin,
        // Datos
        programacion,
        loading,
        saving,
        error,
        // Helpers
        nombreMes: MESES[mes],
        MESES,
        // Acciones
        asignarActividad,
        generarProgramacionAleatoria,
        refresh: cargar
    };
};
