import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "./AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    // Показываем индикатор загрузки, пока проверка не завершена
    if (loading) {
        return <div>Loading...</div>;
    }

    // Если пользователь аутентифицирован, показываем контент
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;

