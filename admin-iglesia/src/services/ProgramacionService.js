import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";

const ACTIVIDADES_DEFAULT = [
    "Bienvenida",
    "Alabanzas y adoración",
    "Ofrenda y anuncios",
    "Dinámica 1",
    "Dinámica 2",
    "Enseñanza y ministración"
];

/**
 * Calcula todos los domingos de un mes dado.
 */
function getDomingosDelMes(anio, mes) {
    const domingos = [];
    const fecha = new Date(anio, mes, 1);
    // Avanzar al primer domingo
    while (fecha.getDay() !== 0) {
        fecha.setDate(fecha.getDate() + 1);
    }
    while (fecha.getMonth() === mes) {
        domingos.push(new Date(fecha));
        fecha.setDate(fecha.getDate() + 7);
    }
    return domingos;
}

class ProgramacionService {
    constructor() {
        this.collectionName = "programacion-mes";
    }

    /**
     * Genera el ID del documento: "{grupo}_{anio}_{mes}"
     */
    _docId(grupo, anio, mes) {
        return `${grupo}_${anio}_${mes}`;
    }

    /**
     * Obtiene la programación de un mes para un grupo.
     * Si no existe, la crea con los domingos del mes y sin participaciones.
     */
    async getProgramacion(grupo, anio, mes) {
        const docId = this._docId(grupo, anio, mes);
        const docRef = doc(db, this.collectionName, docId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data();
            // Convertir Timestamps de las reuniones a Date
            return {
                ...data,
                reuniones: (data.reuniones || []).map(r => ({
                    ...r,
                    fecha: r.fecha?.toDate ? r.fecha.toDate() : new Date(r.fecha)
                }))
            };
        }

        // No existe → crear automáticamente
        const domingos = getDomingosDelMes(anio, mes);
        const reuniones = domingos.map(fecha => ({
            fecha,
            participaciones: {} // { "Nombre Miembro": "Actividad" }
        }));

        const nueva = {
            grupo,
            mes,
            anio,
            actividades: ACTIVIDADES_DEFAULT,
            reuniones,
            creadoEn: serverTimestamp()
        };

        await setDoc(docRef, {
            ...nueva,
            reuniones: reuniones.map(r => ({ ...r, fecha: r.fecha }))
        });

        return nueva;
    }

    /**
     * Guarda toda la programación de un mes (reuniones completas).
     */
    async guardarProgramacion(grupo, anio, mes, reuniones) {
        const docId = this._docId(grupo, anio, mes);
        const docRef = doc(db, this.collectionName, docId);
        await updateDoc(docRef, {
            reuniones,
            actualizadoEn: serverTimestamp()
        });
    }

    /**
     * Actualiza la participación de un miembro en una reunión específica.
     * @param {string} grupo
     * @param {number} anio
     * @param {number} mes
     * @param {number} reunionIndex - índice en el array reuniones
     * @param {string} nombreMiembro
     * @param {string|null} actividad - null para quitar la actividad
     */
    async actualizarParticipacion(grupo, anio, mes, reuniones) {
        return this.guardarProgramacion(grupo, anio, mes, reuniones);
    }
}

export default new ProgramacionService();
