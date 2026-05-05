import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiCalendar, FiAlertCircle, FiCheckCircle, FiFileText, FiCheck, FiTrash2, FiFilter } from 'react-icons/fi';
import api from '../../services/api';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isAdmin, isRH } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const isManagementUser = isAdmin() || isRH();

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    // Listen for notifications updates from navbar - just refetch to stay in sync
    useEffect(() => {
        const handleRefresh = () => fetchNotifications();
        window.addEventListener('refreshNotifications', handleRefresh);
        return () => window.removeEventListener('refreshNotifications', handleRefresh);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
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
            setNotifications(notifs);

            // Also fetch pending leave requests for management users
            if (isManagementUser) {
                try {
                    const leaveRes = await api.get('/leave-requests?status=pending&per_page=100');
                    let pending = leaveRes.data?.data?.data || leaveRes.data?.data || [];
                    if (!Array.isArray(pending)) {
                        pending = [];
                    }
                    
                    // Get dismissed leave IDs
                    const dismissedLeaves = JSON.parse(localStorage.getItem('dismissedLeaveIds') || '[]');
                    
                    // Mark dismissed leaves as read
                    pending = pending.map(p => ({
                        ...p,
                        is_read: dismissedLeaves.includes(p.id)
                    }));
                    
                    setPendingLeaves(pending);
                } catch (e) {
                    console.error('Error fetching pending leaves:', e);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        // If it's a pending leave, just navigate
        if (String(notificationId).startsWith('leave-')) {
            // Remove from pending leaves
            setPendingLeaves(prev => prev.filter(p => `leave-${p.id}` !== notificationId));
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
            navigate('/leave-requests');
            return;
        }
        
        try {
            await api.post(`/notifications/${notificationId}/mark-as-read`);
            setNotifications(prev => prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-as-read');
            
            // Save dismissed leave IDs
            const pendingLeaveIds = pendingLeaves.map(p => p.id);
            localStorage.setItem('dismissedLeaveIds', JSON.stringify(pendingLeaveIds));
            
            // Mark all notifications as read in local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            
            // Mark pending leaves as read
            setPendingLeaves(prev => prev.map(p => ({ ...p, is_read: true })));
            
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
            
            alert('Toutes les notifications ont été marquées comme lues');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            alert('Erreur lors du marquage des notifications');
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification?')) return;
        
        // If it's a pending leave, just remove from display
        if (String(notificationId).startsWith('leave-')) {
            const leaveId = parseInt(notificationId.replace('leave-', ''));
            setPendingLeaves(prev => prev.filter(p => p.id !== leaveId));
            // Add to dismissed IDs
            const dismissed = JSON.parse(localStorage.getItem('dismissedLeaveIds') || '[]');
            if (!dismissed.includes(leaveId)) {
                dismissed.push(leaveId);
                localStorage.setItem('dismissedLeaveIds', JSON.stringify(dismissed));
            }
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
            return;
        }
        
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
            alert('Notification supprimée');
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleNotificationClick = async (notification) => {
        // If it's a pending leave, just navigate
        if (String(notification.id).startsWith('leave-')) {
            navigate('/leave-requests');
            return;
        }
        
        // Mark as read
        try {
            await api.post(`/notifications/${notification.id}/mark-as-read`);
            setNotifications(prev => prev.map(n => 
                n.id === notification.id ? { ...n, read: true } : n
            ));
            // Update navbar
            window.dispatchEvent(new Event('refreshNotifications'));
            localStorage.setItem('notificationsUpdated', Date.now().toString());
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
        
        // Navigate to the link
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        if (filter === 'leave') return n.type === 'leave' || n.type === 'leave_pending';
        return n.type === filter;
    });

    // Create pending leaves notifications for display
    const pendingLeavesNotifications = isManagementUser ? pendingLeaves.map(req => ({
        id: `leave-${req.id}`,
        type: 'leave_pending',
        title: 'Congé en attente',
        message: `${req.employee?.first_name || ''} ${req.employee?.last_name || ''} - ${req.leave_type || 'Congé'} (${req.total_days || 1} jour${req.total_days > 1 ? 's' : ''})`,
        link: '/leave-requests',
        date: req.created_at,
        read: req.is_read !== undefined ? req.is_read : false,
        created_at: req.created_at
    })) : [];

    // Filter pending leaves based on current filter
    const filteredPendingLeaves = filter === 'all' || filter === 'unread' || filter === 'leave' 
        ? pendingLeavesNotifications.filter(n => filter === 'unread' ? !n.read : true)
        : [];

    // Combine all notifications for display
    const allDisplayedNotifications = [...filteredPendingLeaves, ...filteredNotifications];

    const unreadNotifications = notifications.filter(n => !n.read).length;
    const unreadPendingLeaves = pendingLeaves.filter(p => !p.is_read).length;

    const counts = {
        all: notifications.length + pendingLeaves.length,
        unread: unreadNotifications + unreadPendingLeaves,
        leave: pendingLeaves.length + notifications.filter(n => n.type === 'leave' || n.type === 'leave_pending').length,
        absence: notifications.filter(n => n.type === 'absence').length,
        salary: notifications.filter(n => n.type === 'salary').length
    };

    const unreadCount = unreadNotifications + unreadPendingLeaves;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'leave':
            case 'leave_pending':
                return <FiCalendar className="w-5 h-5" />;
            case 'approved': return <FiCheckCircle className="w-5 h-5" />;
            case 'rejected': return <FiAlertCircle className="w-5 h-5" />;
            case 'absence': return <FiAlertCircle className="w-5 h-5" />;
            case 'salary': return <FiFileText className="w-5 h-5" />;
            case 'employee': return <FiBell className="w-5 h-5" />;
            case 'department': return <FiBell className="w-5 h-5" />;
            default: return <FiBell className="w-5 h-5" />;
        }
    };

    const getIconBgColor = (type) => {
        switch (type) {
            case 'leave':
            case 'leave_pending':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'approved': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'absence': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
            case 'salary': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'employee': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'department': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric'
        });
    };

    const formatFullDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle notification'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {(notifications.length > 0 || pendingLeaves.length > 0) && (
                        <>
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <FiCheck size={18} />
                                Tout marquer comme lu
                            </button>
                            <button
                                onClick={async () => {
                                    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications?')) return;
                                    try {
                                        console.log('Deleting all notifications...');
                                        const response = await api.post('/notifications/delete-all');
                                        console.log('Delete response:', response.data);
                                        localStorage.setItem('dismissedLeaveIds', '[]');
                                        setNotifications([]);
                                        setPendingLeaves([]);
                                        window.dispatchEvent(new Event('refreshNotifications'));
                                        alert('Toutes les notifications ont été supprimées');
                                    } catch (error) {
                                        console.error('Error deleting all notifications:', error);
                                        alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <FiTrash2 size={18} />
                                Tout supprimer
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'all' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <FiFilter size={16} />
                    Toutes
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {counts.all}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'unread' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <FiBell size={16} />
                    Non lues
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        filter === 'unread' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {counts.unread}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('leave')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'leave' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <FiCalendar size={16} />
                    Congés
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        filter === 'leave' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {counts.leave}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('absence')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'absence' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <FiAlertCircle size={16} />
                    Absences
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        filter === 'absence' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {counts.absence}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('salary')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === 'salary' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    <FiFileText size={16} />
                    Salaires
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        filter === 'salary' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {counts.salary}
                    </span>
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {allDisplayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <FiBell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Aucune notification</h3>
                        <p className="text-slate-500 dark:text-slate-400">Vous n'avez aucune notification pour le moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {allDisplayedNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBgColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-white">{notification.title}</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                                                <p className="text-xs text-slate-400 mt-2">{formatDate(notification.date || notification.created_at)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                )}
                                                {!String(notification.id).startsWith('leave-') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
