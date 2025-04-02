import axios from "axios";
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || null);
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const BASE_URL = process.env.REACT_APP_API_URL;
    console.log("API URL:", BASE_URL);

    const login = async (email, password) => { 
        setLoading(true);
        setError("");
        try {
            const response = await axios.post(`${BASE_URL}User/login`, {
                userName: email,
                password,
            });

            const { accessToken, refreshToken } = response.data;

            // Store tokens in localStorage and state
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);
            return true; 
        } catch (err) {
            setError("Failed to login. Please check your credentials.");
            console.error(err.response?.data || err.message);
            return false; 
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
        setRefreshToken(null);
    };

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, login, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
