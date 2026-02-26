import React, { createContext, useContext, useState, useEffect } from "react";
import AuthService from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Suscribirse a cambios de Firebase Auth
        const unsubscribe = AuthService.subscribeToAuthChanges(async (firebaseUser) => {
            setLoading(true);
            setError(null);

            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userProfile = await AuthService.getUserProfile(firebaseUser.uid, firebaseUser.email);
                    setProfile(userProfile);
                } catch (err) {
                    setError("No se pudo cargar el perfil del usuario.");
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            await AuthService.login(email, password);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const userProfile = await AuthService.getUserProfile(user.uid, user.email);
            setProfile(userProfile);
            return userProfile;
        } catch (err) {
            console.error("Error refreshing profile:", err);
        }
    };

    const logout = async () => {
        try {
            await AuthService.logout();
        } catch (err) {
            console.error("Logout Error:", err);
        }
    };

    const value = {
        user,
        profile,
        loading,
        error,
        login,
        logout,
        refreshProfile,
        isAdmin: profile?.rol === "admin",
        grupoAsignado: profile?.grupoAsignado || ""
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};
