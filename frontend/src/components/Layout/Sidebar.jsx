import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiHome, FiUsers, FiCalendar, FiClock, FiDollarSign, 
    FiFolder, FiLogOut, FiChevronLeft, FiChevronRight,
    FiUserCheck, FiBriefcase, FiBell, FiX, FiUserPlus, FiTrendingUp, FiAlertTriangle, FiAward,
    FiFileText, FiSettings, FiTarget, FiFile
} from 'react-icons/fi';

const Sidebar = ({ sidebarOpen, setSidebarOpen, isMobile, mobileMenuOpen, setMobileMenuOpen }) => {
    const { user, logout, hasRole, isAdmin, isRH, isEmployee, isResponsable } = useAuth();

    const isRegularEmployee = isEmployee() && !isAdmin() && !isRH() && !isResponsable();

    const handleNavClick = () => {
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    };

    const sidebarClasses = isMobile 
        ? `fixed left-0 top-0 h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-transform duration-300 z-50 w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `fixed left-0 top-0 h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`;

    const getRoleLabel = () => {
        if (isAdmin()) return 'Administrateur';
        if (isRH()) return 'RH Manager';
        if (hasRole('Responsable')) return 'Responsable';
        return 'Employé';
    };

    const menuItems = isRegularEmployee ? [
        { path: '/dashboard', name: 'Dashboard', icon: FiHome },
        { divider: true },
        { path: '/attendance', name: 'Présence', icon: FiClock },
        { path: '/leave-requests', name: 'Mes Congés', icon: FiCalendar },
        { path: '/my-payslip', name: 'Mon Bulletin', icon: FiFileText },
        { divider: true },
        { path: '/performance', name: 'Performance', icon: FiTarget },
        { divider: true },
        { path: '/notifications', name: 'Notifications', icon: FiBell },
        { path: '/settings', name: 'Paramètres', icon: FiSettings },
    ] : isResponsable() ? [
        { path: '/dashboard', name: 'Dashboard', icon: FiHome },
        { divider: true },
        { path: '/employees', name: 'Mon Équipe', icon: FiUsers },
        { path: '/departments', name: 'Mon Département', icon: FiFolder },
        { path: '/attendance', name: 'Présence', icon: FiClock },
        { path: '/leave-requests', name: 'Demandes Congés', icon: FiCalendar },
        { path: '/absences', name: 'Absences', icon: FiClock },
        { divider: true },
        { path: '/performance', name: 'Performance', icon: FiTarget },
        { divider: true },
        { path: '/notifications', name: 'Notifications', icon: FiBell },
        { path: '/settings', name: 'Paramètres', icon: FiSettings },
    ] : isAdmin() ? [
        { path: '/dashboard', name: 'Dashboard', icon: FiHome },
        { divider: true },
        { path: '/employees', name: 'Employés', icon: FiUsers },
        { path: '/interns', name: 'Stagiaires', icon: FiUserPlus },
        { path: '/departments', name: 'Départements', icon: FiFolder },
        { path: '/attendance', name: 'Présence', icon: FiClock },
        { path: '/leave-requests', name: 'Congés', icon: FiCalendar },
        { path: '/absences', name: 'Absences', icon: FiClock },
        { divider: true },
        { path: '/salaries', name: 'Salaires', icon: FiDollarSign },
        { path: '/primes', name: 'Primes', icon: FiAward },
        { path: '/compensation', name: 'Rémunération', icon: FiTrendingUp },
        { path: '/warnings', name: 'Avertissements', icon: FiAlertTriangle },
        { divider: true },
        { path: '/recruitment', name: 'Recrutement', icon: FiUserPlus },
        { divider: true },
        { path: '/employee-documents', name: 'Docs Employés', icon: FiFolder },
        { path: '/documents', name: 'Documents', icon: FiFile },
        { divider: true },
        { path: '/performance', name: 'Performance', icon: FiTarget },
        { divider: true },
        { path: '/users', name: 'Utilisateurs', icon: FiUserCheck },
        { divider: true },
        { path: '/notifications', name: 'Notifications', icon: FiBell },
        { path: '/settings', name: 'Paramètres', icon: FiSettings },
    ] : isRH() ? [
        { path: '/dashboard', name: 'Dashboard', icon: FiHome },
        { divider: true },
        { path: '/employees', name: 'Employés', icon: FiUsers },
        { path: '/interns', name: 'Stagiaires', icon: FiUserPlus },
        { path: '/departments', name: 'Départements', icon: FiFolder },
        { path: '/attendance', name: 'Présence', icon: FiClock },
        { path: '/leave-requests', name: 'Congés', icon: FiCalendar },
        { path: '/absences', name: 'Absences', icon: FiClock },
        { divider: true },
        { path: '/salaries', name: 'Salaires', icon: FiDollarSign },
        { path: '/primes', name: 'Primes', icon: FiAward },
        { path: '/compensation', name: 'Rémunération', icon: FiTrendingUp },
        { path: '/warnings', name: 'Avertissements', icon: FiAlertTriangle },
        { divider: true },
        { path: '/recruitment', name: 'Recrutement', icon: FiUserPlus },
        { divider: true },
        { path: '/employee-documents', name: 'Docs Employés', icon: FiFolder },
        { path: '/documents', name: 'Documents', icon: FiFile },
        { divider: true },
        { path: '/performance', name: 'Performance', icon: FiTarget },
        { divider: true },
        { path: '/notifications', name: 'Notifications', icon: FiBell },
        { path: '/settings', name: 'Paramètres', icon: FiSettings },
    ] : [
        { path: '/dashboard', name: 'Dashboard', icon: FiHome },
        { divider: true },
        { path: '/attendance', name: 'Présence', icon: FiClock },
        { path: '/employees', name: 'Employés', icon: FiUsers },
        { path: '/interns', name: 'Stagiaires', icon: FiUserPlus },
        { path: '/departments', name: 'Départements', icon: FiFolder },
        { path: '/leave-requests', name: 'Congés', icon: FiCalendar },
        { path: '/absences', name: 'Absences', icon: FiClock },
        { divider: true },
        { path: '/performance', name: 'Performance', icon: FiTarget },
        { divider: true },
        { path: '/documents', name: 'Documents', icon: FiFile },
        { divider: true },
        { path: '/notifications', name: 'Notifications', icon: FiBell },
    ];

    const allMenuItems = menuItems;

    return (
        <aside className={sidebarClasses}>
            <div className="flex flex-col h-full">
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <FiBriefcase className="w-5 h-5 text-white" />
                        </div>
                        {(sidebarOpen || isMobile) && (
                            <span className="text-white font-bold text-lg">ElegantHR</span>
                        )}
                    </div>
                    {isMobile ? (
                        <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                            <FiX size={20} />
                        </button>
                    ) : (
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                            {sidebarOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
                        </button>
                    )}
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {allMenuItems.map((item, index) => {
                        if (item.divider) {
                            return (sidebarOpen || isMobile) ? (
                                <div key={index} className="py-2"><div className="border-t border-slate-700"></div></div>
                            ) : null;
                        }
                        
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`
                                }
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && !isMobile && 'mx-auto'}`} />
                                {(sidebarOpen || isMobile) && <span className="font-medium">{item.name}</span>}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-slate-800">
                    {(sidebarOpen || isMobile) ? (
                        <div className="p-3 bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name || 'Utilisateur'}</p>
                                    <p className="text-xs text-slate-400 truncate">{getRoleLabel()}</p>
                                </div>
                                <button
                                    onClick={() => { logout(); handleNavClick(); }}
                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                    title="Déconnexion"
                                >
                                    <FiLogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => { logout(); handleNavClick(); }}
                            className="flex items-center justify-center w-full py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                            title="Déconnexion"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
