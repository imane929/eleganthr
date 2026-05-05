import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiSearch, FiBell, FiMenu, FiMoon, FiSun, FiUser, FiCalendar, FiAlertCircle, FiCheck, FiFileText, FiCheckCircle, FiSettings, FiClock, FiTrash2 } from 'react-icons/fi';

const Navbar = ({ sidebarOpen, setSidebarOpen, isMobile, mobileMenuOpen, setMobileMenuOpen }) => {
    const { user, isAdmin, isRH } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const searchRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    const isManagementUser = isAdmin() || isRH();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        // Fetch notifications on initial load
        fetchNotifications();
    }, []);

    // Listen for notifications updates from page - refetch to stay synced
    useEffect(() => {
        const handleRefresh = () => fetchNotifications();
        window.addEventListener('refreshNotifications', handleRefresh);
        return () => window.removeEventListener('refreshNotifications', handleRefresh);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications?per_page=100');
            let notifs = [];
            if (Array.isArray(response.data.data)) {
                notifs = response.data.data;
            } else if (response.data.data?.data) {
                if (Array.isArray(response.data.data.data)) {
                    notifs = response.data.data.data;
                } else {
                    notifs = response.data.data;
                }
            } else if (Array.isArray(response.data.data)) {
                notifs = response.data.data;
            }
            
            // Fetch pending leaves for management users
            let pendingLeaves = [];
            if (isManagementUser) {
                try {
                    const leaveRes = await api.get('/leave-requests?status=pending&per_page=10');
                    pendingLeaves = leaveRes.data?.data?.data || leaveRes.data?.data || [];
                    if (!Array.isArray(pendingLeaves)) {
                        pendingLeaves = [];
                    }
                } catch (e) {
                    console.error('Error fetching pending leaves:', e);
                }
            }
            
            // Get dismissed leave IDs
            const dismissedLeaves = JSON.parse(localStorage.getItem('dismissedLeaveIds') || '[]');
            
            // Add leave notifications
            if (pendingLeaves.length > 0) {
                const leaveNotifications = pendingLeaves.slice(0, 5).map(req => ({
                    id: `leave-${req.id}`,
                    type: 'leave_pending',
                    title: 'Congé en attente',
                    message: `${req.employee?.first_name || ''} ${req.employee?.last_name || ''} - ${req.leave_type || 'Congé'} (${req.total_days || 1} jour${req.total_days > 1 ? 's' : ''})`,
                    link: '/leave-requests',
                    date: req.created_at,
                    read: dismissedLeaves.includes(req.id)
                }));
                notifs = [...leaveNotifications, ...notifs];
            }
            
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        const notificationIdStr = notificationId.toString();
        
        // Check if it's a pending leave notification
        if (notificationIdStr.startsWith('leave-')) {
            // Remove from notifications list (locally)
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (unreadCount > 0) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            window.dispatchEvent(new Event('refreshNotifications'));
            return;
        }
        
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        const wasUnread = !notification.read;
        
        try {
            await api.post(`/notifications/${notificationId}/mark-as-read`);
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-as-read');
            
            // Save dismissed leave IDs
            const pendingLeaves = notifications.filter(n => String(n.id).startsWith('leave-') && !n.read);
            const dismissedIds = pendingLeaves.map(n => parseInt(String(n.id).replace('leave-', '')));
            localStorage.setItem('dismissedLeaveIds', JSON.stringify(dismissedIds));
            
            // Mark all as read locally
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        const notificationIdStr = notificationId.toString();
        
        if (notificationIdStr.startsWith('leave-')) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (unreadCount > 0) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            window.dispatchEvent(new Event('refreshNotifications'));
            return;
        }
        
        try {
            await api.delete(`/notifications/${notificationId}`);
            const notification = notifications.find(n => n.id === notificationId);
            const wasUnread = notification && !notification.read;
            
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (wasUnread && unreadCount > 0) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        await markAsRead(notification.id);
        setShowNotifications(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const [employeesRes, departmentsRes] = await Promise.all([
                api.get(`/employees?search=${query}&per_page=5`),
                api.get(`/departments?search=${query}&per_page=5`)
            ]);

            const employees = employeesRes.data.data?.data || [];
            const departments = departmentsRes.data.data?.data || [];

            setSearchResults([
                ...employees.map(e => ({ type: 'employee', id: e.id, name: `${e.first_name} ${e.last_name}`, subtitle: e.position })),
                ...departments.map(d => ({ type: 'department', id: d.id, name: d.name, subtitle: 'Département' }))
            ]);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleResultClick = (result) => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearch(false);
        if (result.type === 'employee') {
            navigate(`/employees/${result.id}`);
        } else if (result.type === 'department') {
            navigate('/departments');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'leave': return <FiCalendar className="w-4 h-4" />;
            case 'leave_pending': return <FiClock className="w-4 h-4" />;
            case 'approved': return <FiCheckCircle className="w-4 h-4" />;
            case 'absence': return <FiAlertCircle className="w-4 h-4" />;
            case 'salary': return <FiFileText className="w-4 h-4" />;
            default: return <FiBell className="w-4 h-4" />;
        }
    };

    const getIconBgColor = (type) => {
        switch (type) {
            case 'leave': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'leave_pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'approved': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'absence': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
            case 'salary': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'À l\'instant';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 172800) return 'Hier';
        return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                        <FiMenu size={22} />
                    </button>
                    
                    <div className="relative" ref={searchRef}>
                        <div className="hidden md:flex items-center">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => setShowSearch(true)}
                                    className="w-40 lg:w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {showSearch && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                                    >
                                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                            {result.type === 'employee' ? (
                                                <FiUser className="text-indigo-600" size={16} />
                                            ) : (
                                                <FiCalendar className="text-indigo-600" size={16} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{result.name}</p>
                                            <p className="text-xs text-slate-500">{result.subtitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                        {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>

                    <div className="relative" ref={notifRef}>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors relative"
                        >
                            <FiBell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                                    <div className="flex items-center gap-3">
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={markAllAsRead}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                                            >
                                                Tout marquer comme lu
                                            </button>
                                        )}
                                        <span className="text-slate-300">|</span>
                                        <button 
                                            onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                                        >
                                            Voir tout
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-slate-500">
                                            Aucune notification
                                        </div>
                                    ) : (
                                        <div>
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 ${!notif.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                                >
                                                    <div className="mt-1">
                                                        <FiBell className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{notif.title}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{notif.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <FiUser className="text-indigo-600 dark:text-indigo-400" size={16} />
                            </div>
                            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {user?.name || 'Profil'}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                        <FiSettings size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

