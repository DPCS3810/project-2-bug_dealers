import { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                const decoded = jwtDecode(token);
                setUser({ username: decoded.username || 'User', id: decoded.user_id });
            } catch (e) {
                logout();
            }
        } else {
            delete client.defaults.headers.common['Authorization'];
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        const res = await client.post('/auth/login/', { username, password });
        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);
    };

    const register = async (username, email, password) => {
        await client.post('/auth/register/', { username, email, password });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
