import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * Servicio para gestionar la autenticación y datos básicos del usuario logueado.
 */
class AuthService {
    /**
     * Inicia sesión con email y contraseña.
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Cierra la sesión activa.
     */
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Obtiene el perfil del usuario desde la colección 'usuarios' en Firestore.
     * Intenta primero por UID (ID del documento) y luego por email como fallback.
     */
    async getUserProfile(uid, email = null) {
        try {
            // 1. Intentar obtener por ID de documento (UID)
            const userDoc = await getDoc(doc(db, "usuarios", uid));
            if (userDoc.exists()) {
                return this._normalizeProfileData(userDoc.data());
            }

            // 2. Fallback: buscar por campo 'correo' si no coincide el ID del documento
            if (email) {
                const q = query(collection(db, "usuarios"), where("correo", "==", email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    return this._normalizeProfileData(querySnapshot.docs[0].data());
                }
            }

            return null;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    _normalizeProfileData(data) {
        return {
            ...data,
            grupoAsignado: data.grupoAsignado || data["grupo asignado"] || "",
            rol: data.rol || "lider"
        };
    }

    /**
     * Suscribe a los cambios en el estado de autenticación.
     */
    subscribeToAuthChanges(callback) {
        return onAuthStateChanged(auth, callback);
    }

    _handleError(error) {
        console.error("AuthService Error:", error.code, error.message);
        // Traducción de errores comunes de Firebase
        switch (error.code) {
            case "auth/user-not-found":
                return new Error("El usuario no existe.");
            case "auth/wrong-password":
                return new Error("Contraseña incorrecta.");
            case "auth/invalid-email":
                return new Error("Email no válido.");
            default:
                return new Error("Error en la autenticación. Intente de nuevo.");
        }
    }
}

export default new AuthService();
