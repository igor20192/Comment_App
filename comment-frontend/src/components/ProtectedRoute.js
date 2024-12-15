import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "./AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);

    // Show loading indicator until verification is complete
    if (loading) {
        return <div>Loading...</div>;
    }

    // If the user is authenticated, display the content
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;

