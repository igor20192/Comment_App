import React, { createContext, useState, useEffect } from "react";
import api from "./api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Новое состояние для загрузки

    useEffect(() => {
        const refreshToken = async () => {
            try {
                const response = await api.post("/token/refresh/", {}, { withCredentials: true });
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Failed to refresh token", error);
                setIsAuthenticated(false);
            }
        };
    
        const interval = setInterval(refreshToken, 4 * 60 * 1000); // Обновляем каждые 4 минуты
        return () => clearInterval(interval);
    }, []);
    
    

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get("/auth/check/");
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false); // Завершаем загрузку
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            await api.post("/auth/login/", { username, password });
            setIsAuthenticated(true);
        } catch (error) {
            throw new Error("Invalid credentials");
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout/");
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
