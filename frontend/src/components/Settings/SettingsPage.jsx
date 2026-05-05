import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FiUser, FiLock, FiBell, FiSave } from 'react-icons/fi';

const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await api.put('/profile', profileData);
            if (response.data.success) {
                setSuccess('Profil mis à jour avec succès');
                localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        if (passwordData.password !== passwordData.password_confirmation) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }
        
        try {
            const response = await api.post('/profile/change-password', {
                current_password: passwordData.current_password,
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation
            });
            if (response.data.success) {
                setSuccess('Mot de passe changé avec succès');
                setPasswordData({
                    current_password: '',
                    password: '',
                    password_confirmation: ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Paramètres</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos informations personnelles</p>
            </div>

            {success && (
                <div className="mb-4 p-4 bg-emerald-100 border border-emerald-400 text-emerald-700 rounded-lg">
                    {success}
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="border-b border-slate-100 dark:border-slate-700">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'profile'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <FiUser size={18} />
                                Profil
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'password'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <FiLock size={18} />
                                Mot de passe
                            </span>
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={profileData.phone || ''}
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Numéro de téléphone"
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <FiSave size={18} />
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Mot de passe actuel
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <FiLock size={18} />
                                {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
