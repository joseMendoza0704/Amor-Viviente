import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, deleteApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
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

    /**
     * Obtiene todos los usuarios (Solo para gestión administrativa).
     */
    async getAllUsers() {
        try {
            const querySnapshot = await getDocs(collection(db, "usuarios"));
            return querySnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Actualiza el perfil de un usuario.
     */
    async updateUserProfile(uid, data) {
        try {
            const userRef = doc(db, "usuarios", uid);
            await updateDoc(userRef, {
                ...data,
                ultimaActualizacion: new Date()
            });
            return true;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Crea un nuevo usuario en Firebase Auth + perfil en Firestore.
     * Usa una app Firebase secundaria temporal para no interrumpir la sesión del admin.
     */
    async crearUsuario(email, password, profileData) {
        // Nombre único para evitar colisión con apps existentes
        const tempAppName = `temp-create-user-${Date.now()}`;
        let tempApp = null;

        try {
            // Leer la config de la app principal
            const mainApp = getApps().find(a => a.name === '[DEFAULT]');
            const mainConfig = mainApp.options;

            // Inicializar app temporal
            tempApp = initializeApp(mainConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            // Crear el usuario en Auth (sin afectar la sesión del admin)
            const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUid = credential.user.uid;

            // Desloguearse en la app temporal (buena práctica)
            await signOut(tempAuth);

            // Guardar el perfil en Firestore
            await setDoc(doc(db, "usuarios", newUid), {
                correo: email,
                nombre: profileData.nombre || '',
                rol: profileData.rol || 'lider',
                grupoAsignado: '',
                listaGrupos: [],
                creadoEn: serverTimestamp()
            });

            return newUid;
        } catch (error) {
            throw this._handleError(error);
        } finally {
            // Destruir la app temporal siempre
            if (tempApp) {
                await deleteApp(tempApp).catch(() => { });
            }
        }
    }

    _normalizeProfileData(data) {
        return {
            ...data,
            // Soporte para múltiples grupos (array) o uno solo (string)
            listaGrupos: data.listaGrupos || (data.grupoAsignado ? [data.grupoAsignado] : []),
            grupoAsignado: data.grupoAsignado || data["grupo asignado"] || "",
            rol: data.rol || "lider",
            isAdmin: data.rol === "admin"
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
        switch (error.code) {
            case "auth/user-not-found":
                return new Error("El usuario no existe.");
            case "auth/wrong-password":
                return new Error("Contraseña incorrecta.");
            case "auth/invalid-email":
                return new Error("Email no válido.");
            case "auth/email-already-in-use":
                return new Error("Este correo ya está registrado en el sistema.");
            case "auth/weak-password":
                return new Error("La contraseña debe tener al menos 6 caracteres.");
            case "auth/invalid-credential":
                return new Error("Credenciales incorrectas. Verifica tu correo y contraseña.");
            default:
                return new Error("Error en la autenticación. Intente de nuevo.");
        }
    }
}

export default new AuthService();
