import React from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "./AppWrapper";
import { isTokenValid } from "../utils/cookies";

type ProtectedRouteProps = {
    children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { authToken } = useAppContext();
    const isValid = isTokenValid(authToken);
    if (!isValid) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;