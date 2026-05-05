import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from 'react-icons/fi';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeCredential, setActiveCredential] = useState(null);

    const testAccounts = [
        { role: 'Administrateur', email: 'admin.system@elegantart.com', password: 'admin123' },
        { role: 'Responsable RH', email: 'siham.housni@elegantart.com', password: 'siham123' },
        { role: 'Employé', email: 'nizar.jourchi@elegantart.com', password: 'nizar123' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getDashboardRoute = (userData) => {
        return '/dashboard';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const dashboardRoute = getDashboardRoute(userData);
            navigate(dashboardRoute);
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full"></div>
                </div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ 
                         backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                         backgroundSize: '60px 60px'
                     }}>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-center">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">ElegantHR</h1>
                        <p className="text-slate-300 text-lg max-w-md mx-auto">
                            Système de Gestion des Ressources Humaines<br/>
                            pour <span className="text-indigo-400">Elegant Art Studio</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <FiShield className="text-indigo-400" />
                            <span>Sécurisé</span>
                        </div>
                        <div className="w-px h-4 bg-slate-600"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span>24/7 Disponible</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white dark:bg-slate-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-6 sm:mb-8 text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">ElegantHR</h1>
                    </div>

                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">Bon retour</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Connectez-vous pour accéder à votre tableau de bord</p>
                    </div>

                    {error && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <FiMail className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm sm:text-base"
                                    placeholder="vous@entreprise.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Mot de passe
                                </label>
                                <Link to="/forgot-password" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 sm:pl-11 pr-12 sm:pr-14 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm sm:text-base"
                                    placeholder="••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                Se souvenir de moi
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 sm:h-14 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
                            Pas encore de compte ?{' '}
                            <button 
                                onClick={() => {
                                    const adminEmail = 'admin.system@elegantart.com';
                                    const subject = encodeURIComponent('Demande de création de compte');
                                    const body = encodeURIComponent('Bonjour,\n\nJe souhaiterais créer un compte sur la plateforme ElegantHR.\n\nNom: \nEmail: \nTéléphone:\n\nMerci de me tenir informé(e).\nCordialement,');
                                    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
                                }}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                                Contacter l'administrateur
                            </button>
                        </p>
                    </div>

                    {/* Test Accounts - Hidden on very small screens */}
                    <div className="hidden sm:block mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Comptes de test</p>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            {testAccounts.map((account, index) => (
                                <div key={index} className="relative">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{account.role}</span>
                                        <button
                                            onClick={() => setActiveCredential(activeCredential === index ? null : index)}
                                            className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                        >
                                            {account.email}
                                        </button>
                                    </div>
                                    {activeCredential === index && (
                                        <div className="absolute right-0 top-full mt-1 z-10 p-3 bg-white dark:bg-slate-800 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-lg">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mot de passe:</p>
                                            <code className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400 font-bold">{account.password}</code>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
