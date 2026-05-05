import { useNotification } from '../../contexts/NotificationContext';
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiXCircle } from 'react-icons/fi';

const NotificationItem = ({ notification, onClose }) => {
    const icons = {
        success: <FiCheck className="w-5 h-5" />,
        error: <FiXCircle className="w-5 h-5" />,
        warning: <FiAlertCircle className="w-5 h-5" />,
        info: <FiInfo className="w-5 h-5" />
    };

    const styles = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    return (
        <div className={`${styles[notification.type]} text-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 animate-slide-in`}>
            <div className="flex items-center gap-3">
                {icons[notification.type]}
                <p className="font-medium">{notification.message}</p>
            </div>
            <button 
                onClick={() => onClose(notification.id)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                <FiX className="w-4 h-4" />
            </button>
        </div>
    );
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {notifications.map((notification) => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClose={removeNotification} 
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
