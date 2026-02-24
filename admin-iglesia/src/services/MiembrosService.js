import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Servicio para la gestión de miembros (CRM).
 * Implementa el patrón Repository para aislar Firestore de los componentes.
 */
class MiembrosService {
    constructor() {
        this.collectionName = "miembros";
    }

    /**
     * Obtiene los miembros pertenecientes a un grupo específico.
     */
    async getMiembrosPorGrupo(grupo) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where("grupo", "==", grupo)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error(`Error al obtener miembros: ${error.message}`);
        }
    }

    /**
     * Actualiza los datos de un miembro (notas, estado de seguimiento, etc).
     */
    async actualizarMiembro(nombreId, data) {
        try {
            const memberRef = doc(db, this.collectionName, nombreId);
            await updateDoc(memberRef, {
                ...data,
                ultimaActualizacion: serverTimestamp()
            });
            return true;
        } catch (error) {
            throw new Error(`Error al actualizar miembro: ${error.message}`);
        }
    }

    /**
     * Registra un nuevo miembro en la base de datos.
     */
    async agregarMiembro(miembroData) {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), {
                ...miembroData,
                activo: true,
                estadoSeguimiento: miembroData.estadoSeguimiento || "En consolidación",
                fechaPrimeraVisita: serverTimestamp(),
                totalAsistencias: 0
            });
            return docRef.id;
        } catch (error) {
            throw new Error(`Error al agregar miembro: ${error.message}`);
        }
    }

    /**
     * Da de baja a un miembro (cambio de estado activo).
     */
    async desactivarMiembro(id) {
        try {
            const memberRef = doc(db, this.collectionName, id);
            await updateDoc(memberRef, {
                activo: false,
                ultimaActualizacion: serverTimestamp()
            });
            return true;
        } catch (error) {
            throw new Error(`Error al desactivar miembro: ${error.message}`);
        }
    }
}

export default new MiembrosService();
