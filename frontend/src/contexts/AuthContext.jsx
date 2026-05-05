import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            extractPermissions(parsedUser);
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const extractPermissions = (userData) => {
        const perms = [];
        if (userData?.roles) {
            userData.roles.forEach(role => {
                if (role.permissions) {
                    role.permissions.forEach(perm => {
                        if (!perms.includes(perm.name)) {
                            perms.push(perm.name);
                        }
                    });
                }
            });
        }
        setPermissions(perms);
    };

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/profile');
            const userData = response.data.data;
            const userObj = userData.user || userData;
            setUser(userObj);
            extractPermissions(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
        } catch (error) {
            console.error('Erreur chargement profil:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await api.post('/login', {
                email,
                password
            });

            if (response.data.success) {
                const { token, user: userData } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                extractPermissions(userData);
                return { success: true };
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Erreur de connexion');
            return { 
                success: false, 
                error: error.response?.data?.message || 'Erreur de connexion' 
            };
        }
    };

    const register = async (userData) => {
        setError(null);
        try {
            const response = await api.post('/register', userData);
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                extractPermissions(user);
                return { success: true };
            }
        } catch (error) {
            setError(error.response?.data?.message || "Erreur d'inscription");
            return { 
                success: false, 
                error: error.response?.data?.message || "Erreur d'inscription" 
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setPermissions([]);
            window.location.href = '/login';
        }
    };

    const hasRole = (role) => {
        return user?.roles?.some(r => r.name === role) || false;
    };

    const hasPermission = (permission) => {
        if (!permission) return true;
        if (isAdmin()) return true;
        return permissions.includes(permission);
    };

    const isAdmin = () => hasRole('Admin') || hasRole('administrator') || hasRole('admin');
    const isRH = () => hasRole('HR Manager') || hasRole('rh') || hasRole('Responsable RH');
    const isResponsable = () => hasRole('Responsable');
    const isEmployee = () => hasRole('Employee');

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
        isAdmin,
        isRH,
        isResponsable,
        isEmployee,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
