import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// ProtectedRoute Component
const ProtectedRoute = () => {
    const { accessToken } = useContext(AuthContext); 
    const { refreshToken } = useContext(AuthContext);

    if (!accessToken || !refreshToken) {
        return <Navigate to="/login" replace />; // Redirect to login if tokens are missing
    }

    return <Outlet />; // Render child components if authenticated
};

// Define Routes
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/home" replace />, // Redirect "/" to "/home"
    },
    {
        path: "/login",
        element: <LoginPage />, // Login page should always be accessible
    },
    {
        path: "/",
        element: <ProtectedRoute />, // Protect all child routes
        children: [
            {
                path: "/home",
                element: <HomePage />, // HomePage is only accessible if authenticated
            },
        ],
    },
]);
