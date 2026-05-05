import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiBriefcase, FiHome, FiEdit, FiSave } from 'react-icons/fi';

const MyProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
        emergency_contact: '',
        emergency_phone: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/profile');
            if (response.data.success) {
                const data = response.data.data;
                setProfile(data.user || data);
                setEmployee(data.employee);
                if (data.employee) {
                    setFormData({
                        phone: data.employee.phone || '',
                        address: data.employee.address || '',
                        emergency_contact: data.employee.emergency_contact || '',
                        emergency_phone: data.employee.emergency_phone || ''
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/profile', formData);
            setEditing(false);
            fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'active') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Actif
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                Inactif
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                <FiUser className="mx-auto h-16 w-16 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">Profil non trouvé</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Impossible de charger vos informations.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mon Profil</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos informations personnelles</p>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        <FiEdit size={18} />
                        Modifier
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditing(false);
                                setFormData({
                                    phone: employee?.phone || '',
                                    address: employee?.address || '',
                                    emergency_contact: employee?.emergency_contact || '',
                                    emergency_phone: employee?.emergency_phone || ''
                                });
                            }}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            <FiSave size={18} />
                            Enregistrer
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-4xl mb-4">
                                {profile?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {employee?.full_name || profile?.name}
                            </h2>
                            {employee?.position && (
                                <p className="text-slate-500 dark:text-slate-400">{employee.position}</p>
                            )}
                            {employee && <div className="mt-3">{getStatusBadge(employee.status)}</div>}
                            
                            <div className="mt-6 space-y-3 text-left">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <FiMail className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                        {profile?.email || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <FiPhone className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {employee?.phone || 'Non renseigné'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <FiMapPin className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {employee?.address || 'Non renseigné'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {employee && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Informations Professionnelles</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Matricule</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{employee.employee_id || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Poste</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{employee.position || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Département</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{employee.department?.name || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type de contrat</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{employee.contract_type || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date d'embauche</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {employee.hire_date ? employee.hire_date.split('T')[0] : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Salaire de base</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {employee.base_salary ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(employee.base_salary) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Informations Personnelles</h3>
                            
                            {editing ? (
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact d'urgence</label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact}
                                                onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone d'urgence</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_phone}
                                                onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Téléphone</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{employee?.phone || 'Non renseigné'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Adresse</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{employee?.address || 'Non renseignée'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contact d'urgence</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{employee?.emergency_contact || 'Non renseigné'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Téléphone d'urgence</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{employee?.emergency_phone || 'Non renseigné'}</p>
                                    </div>
                                    {employee && (
                                        <>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">CIN</p>
                                                <p className="font-medium text-slate-800 dark:text-white">{employee.cin || 'Non renseigné'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date de naissance</p>
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {employee.date_of_birth ? employee.date_of_birth.split('T')[0] : 'Non renseignée'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );
};

export default MyProfilePage;
