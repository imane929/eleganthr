import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const success = useCallback((message) => addNotification(message, 'success'), [addNotification]);
    const error = useCallback((message) => addNotification(message, 'error'), [addNotification]);
    const warning = useCallback((message) => addNotification(message, 'warning'), [addNotification]);
    const info = useCallback((message) => addNotification(message, 'info'), [addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, success, error, warning, info }}>
            {children}
        </NotificationContext.Provider>
    );
};
