import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Servicio para gestionar los registros de asistencia de los grupos.
 */
class AsistenciaService {
    constructor() {
        this.collectionName = "asistencia-iglesia";
    }

    async getAsistenciasPorGrupo(grupo, maxResults = 8) {
        console.log("AsistenciaService: Consultando para grupo:", grupo);
        try {
            let q;
            if (grupo) {
                q = query(
                    collection(db, this.collectionName),
                    where("grupo", "==", grupo),
                    orderBy("timestamp", "desc"),
                    limit(maxResults)
                );
            } else {
                q = query(
                    collection(db, this.collectionName),
                    orderBy("timestamp", "desc"),
                    limit(maxResults)
                );
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return data.reverse();
        } catch (error) {
            console.error("Error en AsistenciaService:", error);
            throw error;
        }
    }

    /**
     * Obtiene registros de asistencia de un mes específico.
     * @param {string} grupo - Grupo.
     * @param {number} mes - 0-11.
     * @param {number} anio - Año.
     */
    async getAsistenciasPorMes(grupo, mes, anio) {
        const { Timestamp } = await import("firebase/firestore");
        const inicio = new Date(anio, mes, 1);
        const fin = new Date(anio, mes + 1, 0, 23, 59, 59);

        try {
            const constraints = [
                where("timestamp", ">=", Timestamp.fromDate(inicio)),
                where("timestamp", "<=", Timestamp.fromDate(fin)),
                orderBy("timestamp", "asc")
            ];

            if (grupo) {
                constraints.unshift(where("grupo", "==", grupo));
            }

            const q = query(collection(db, this.collectionName), ...constraints);

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error en getAsistenciasPorMes:", error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de asistencia específico.
     * @param {string} id - ID del documento.
     * @param {object} data - Datos a actualizar.
     */
    /**
     * Actualiza un registro de asistencia específico.
     * @param {string} id - ID del documento.
     * @param {object} data - Datos a actualizar.
     */
    async updateAsistencia(id, data) {
        const { updateDoc, doc } = await import("firebase/firestore");
        const docRef = doc(db, this.collectionName, id);
        return await updateDoc(docRef, data);
    }

    /**
     * Elimina un registro de asistencia específico.
     * @param {string} id - ID del documento.
     */
    async deleteAsistencia(id) {
        const { deleteDoc, doc } = await import("firebase/firestore");
        const docRef = doc(db, this.collectionName, id);
        return await deleteDoc(docRef);
    }
}

export default new AsistenciaService();
