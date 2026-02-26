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

    // Estado para grupos disponibles (para admins)
    const [listaGrupos, setListaGrupos] = useState([]);
    const [filtroGrupo, setFiltroGrupo] = useState('');

    // Estado del mes seleccionado para el filtro
    const [filtroMes, setFiltroMes] = useState(new Date().getMonth());
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());

    // Inicializar el filtro de grupo con el asignado al perfil
    useEffect(() => {
        if (!filtroGrupo) {
            if (profile?.grupoAsignado) {
                setFiltroGrupo(profile.grupoAsignado);
            } else if (profile?.listaGrupos && profile.listaGrupos.length > 0) {
                setFiltroGrupo(profile.listaGrupos[0]);
            }
        }
    }, [profile?.grupoAsignado, profile?.listaGrupos]);

    const fetchData = useCallback(async () => {
        // El administrador puede ver todo, los líderes necesitan grupo.
        // Si filtroGrupo es "" (Todos), lo tomamos tal cual para la consulta.
        const grupoABuscar = filtroGrupo;

        // Si no hay grupo y NO es admin, no buscar.
        if (!grupoABuscar && !profile?.isAdmin) return;

        setLoading(true);
        setError(null);
        try {
            // Cargar miembros, asistencias y la lista de todos los grupos si es admin
            const promesas = [
                MiembrosService.getMiembrosPorGrupo(grupoABuscar),
                AsistenciaService.getAsistenciasPorMes(grupoABuscar, filtroMes, filtroAnio)
            ];

            if (profile?.isAdmin) {
                promesas.push(MiembrosService.getTodosLosGrupos());
            }

            const [miembrosData, asistenciasData, gruposTotal] = await Promise.all(promesas);

            setMiembros(miembrosData);
            setAsistencias(asistenciasData);

            // Los admins ven todos los grupos de la BD.
            // Los no-admins solo ven los grupos asignados a su perfil.
            if (profile?.isAdmin) {
                const adminGrupos = new Set([
                    ...(profile?.listaGrupos || []),
                    ...(gruposTotal || [])
                ]);
                if (profile?.grupoAsignado) adminGrupos.add(profile.grupoAsignado);
                setListaGrupos(Array.from(adminGrupos).filter(Boolean).sort());
            } else {
                // Solo grupos explícitamente asignados al perfil del usuario
                const perfilGrupos = new Set(profile?.listaGrupos || []);
                if (profile?.grupoAsignado) perfilGrupos.add(profile.grupoAsignado);
                setListaGrupos(Array.from(perfilGrupos).filter(Boolean).sort());
            }
        } catch (err) {
            console.error("useMiembros Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.grupoAsignado, profile?.listaGrupos, profile?.isAdmin, filtroGrupo, filtroMes, filtroAnio]);

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

        // Ordenar por Jerarquía: Líder (1) -> Asistente (2) -> Tesorero (3) -> Congregante / otros (4)
        const ORDEN_JERARQUIA = {
            'Líder': 1,
            'Asistente': 2,
            'Tesorero': 3
        };

        return miembrosProcesados.sort((a, b) => {
            const getOrden = (rol) => ORDEN_JERARQUIA[rol] || 4;
            const ordenA = getOrden(a.rol);
            const ordenB = getOrden(b.rol);

            if (ordenA !== ordenB) {
                return ordenA - ordenB; // Por jerarquía
            }
            // Mismo rol: ordenar alfabéticamente por nombre
            return (a.nombre || '').localeCompare(b.nombre || '');
        });
    }, [miembros, asistencias]);

    // Mapa de roboles únicos ocupados en el grupo actual: { 'Líder': 'Juan P.', 'Tesorero': 'Ana M.' }
    const rolesOcupados = useMemo(() => {
        const ocupados = {};
        miembrosConAsistencia.forEach(m => {
            if (m.activo !== false && m.rol && m.rol !== '' && m.rol !== 'Congregante') {
                ocupados[m.rol] = m.nombre;
            }
        });
        return ocupados;
    }, [miembrosConAsistencia]);

    const agregarMiembro = async (data) => {
        const id = await MiembrosService.agregarMiembro({
            ...data,
            grupo: filtroGrupo || profile.grupoAsignado
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
        asistencias,
        filtroMes,
        filtroAnio,
        setFiltroMes,
        setFiltroAnio,
        filtroGrupo,
        setFiltroGrupo,
        listaGrupos,
        rolesOcupados,
        loading,
        error,
        agregarMiembro,
        actualizarMiembro,
        desactivarMiembro,
        actualizarAsistenciaMiembro,
        refresh: fetchData
    };
};
