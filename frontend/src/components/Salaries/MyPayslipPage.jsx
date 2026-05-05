import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiDownload, FiFileText, FiCalendar, FiDollarSign, FiPrinter } from 'react-icons/fi';

const MyPayslipPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    useEffect(() => {
        fetchMyPayslips();
    }, []);

    const fetchMyPayslips = async () => {
        try {
            setLoading(true);
            const response = await api.get('/my-salaries');
            let data = [];
            if (response.data.success) {
                data = response.data.data || [];
            } else if (Array.isArray(response.data.data)) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }
            setPayslips(data);
            if (data.length > 0) {
                setSelectedPayslip(data[0]);
            }
        } catch (err) {
            console.error('Error fetching payslips:', err);
            try {
                const response = await api.get('/my-salary');
                if (response.data.success && response.data.data) {
                    const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                    setPayslips(data);
                    if (data.length > 0) {
                        setSelectedPayslip(data[0]);
                    }
                }
            } catch (err2) {
                console.error('Fallback also failed:', err2);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(amount || 0);
    };

    const formatMonth = (monthStr) => {
        if (!monthStr) return '';
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, parseInt(month) - 1);
            return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        } catch {
            return monthStr;
        }
    };

    const handleDownload = async (payslip) => {
        try {
            const response = await api.get(`/my-salaries/${payslip.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bulletin_${payslip.month || 'paye'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Erreur lors du téléchargement');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mes Bulletins de Paie</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Visualisez et téléchargez vos bulletins de salaire</p>
                </div>
            </div>

            {payslips.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                    <FiFileText className="mx-auto h-16 w-16 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">Aucun bulletin de paie</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Vos bulletins de paie apparaîtront ici lorsqu'ils seront disponibles.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Historique
                        </h3>
                        <div className="space-y-2">
                            {payslips.map((payslip) => (
                                <button
                                    key={payslip.id}
                                    onClick={() => setSelectedPayslip(payslip)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                        selectedPayslip?.id === payslip.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            selectedPayslip?.id === payslip.id
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                                : 'bg-slate-100 dark:bg-slate-700'
                                        }`}>
                                            <FiFileText className={`w-5 h-5 ${
                                                selectedPayslip?.id === payslip.id
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800 dark:text-white">
                                                {formatMonth(payslip.month)}
                                            </p>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {formatCurrency(payslip.net_amount)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {selectedPayslip ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                            Bulletin de Paie - {formatMonth(selectedPayslip.month)}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            généré le {selectedPayslip.payment_date ? selectedPayslip.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDownload(selectedPayslip)}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                        >
                                            <FiDownload size={18} />
                                            Télécharger
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <FiPrinter size={18} />
                                            Imprimer
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6" id="payslip-content">
                                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Salaire Brut</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(selectedPayslip.gross_amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Salaire Net</p>
                                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(selectedPayslip.net_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Gains
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                    <span className="text-slate-600 dark:text-slate-400">Salaire de base</span>
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(selectedPayslip.base_salary || selectedPayslip.gross_amount)}
                                                    </span>
                                                </div>
                                                {selectedPayslip.bonus > 0 && (
                                                    <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                        <span className="text-slate-600 dark:text-slate-400">Primes</span>
                                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                            +{formatCurrency(selectedPayslip.bonus)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Déductions
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                                    <span className="text-slate-600 dark:text-slate-400">Impôts</span>
                                                    <span className="font-medium text-rose-600 dark:text-rose-400">
                                                        -{formatCurrency(selectedPayslip.tax_amount || selectedPayslip.deductions || 0)}
                                                    </span>
                                                </div>
                                                {selectedPayslip.deductions > 0 && (
                                                    <div className="flex justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                                        <span className="text-slate-600 dark:text-slate-400">Autres déductions</span>
                                                        <span className="font-medium text-rose-600 dark:text-rose-400">
                                                            -{formatCurrency(selectedPayslip.deductions)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Net à payer</span>
                                            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatCurrency(selectedPayslip.net_amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                                <FiFileText className="mx-auto h-12 w-12 text-slate-400" />
                                <p className="mt-4 text-slate-500 dark:text-slate-400">
                                    Sélectionnez un bulletin de paie pour le visualiser
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPayslipPage;
