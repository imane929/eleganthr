import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RecruitmentPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('offers');
    const [loading, setLoading] = useState(true);

    const [offers, setOffers] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [users, setUsers] = useState([]);

    const [showOfferForm, setShowOfferForm] = useState(false);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [showInterviewForm, setShowInterviewForm] = useState(false);

    const [offerForm, setOfferForm] = useState({ title: '', department: '', location: '', employment_type: 'full_time', description: '', requirements: '', salary_min: '', salary_max: '', openings: 1, closing_date: '', status: 'draft' });
    const [candidateForm, setCandidateForm] = useState({ first_name: '', last_name: '', email: '', phone: '', current_position: '', expected_salary: '', linkedin: '', summary: '' });
    const [candidateFile, setCandidateFile] = useState(null);
    const [interviewForm, setInterviewForm] = useState({ application_id: '', interviewer_id: '', type: 'phone', scheduled_at: '', location: '', meeting_link: '' });

    useEffect(() => { loadData(); loadUsers(); }, []);

    const loadData = async () => {
        try {
            const [offersRes, candidatesRes, appsRes, interviewsRes] = await Promise.all([
                api.get('/recruitment/offers', { params: { per_page: 50 } }),
                api.get('/recruitment/candidates', { params: { per_page: 50 } }),
                api.get('/recruitment/applications', { params: { per_page: 50 } }),
                api.get('/recruitment/interviews', { params: { per_page: 50 } }),
            ]);
            setOffers(offersRes.data.data.data || offersRes.data.data);
            setCandidates(candidatesRes.data.data.data || candidatesRes.data.data);
            setApplications(appsRes.data.data.data || appsRes.data.data);
            setInterviews(interviewsRes.data.data.data || interviewsRes.data.data);
        } catch (error) {
            toast.error('Failed to load recruitment data');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data.data.data || data.data || []);
        } catch (e) { /* ignore */ }
    };

    const createOffer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/recruitment/offers', offerForm);
            toast.success('Job offer created');
            setShowOfferForm(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create offer');
        }
    };

    const createCandidate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.entries(candidateForm).forEach(([k, v]) => { if (v) formData.append(k, v); });
            if (candidateFile) formData.append('cv', candidateFile);
            await api.post('/recruitment/candidates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Candidate created');
            setShowCandidateForm(false);
            setCandidateForm({ first_name: '', last_name: '', email: '', phone: '', current_position: '', expected_salary: '', linkedin: '', summary: '' });
            setCandidateFile(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create candidate');
        }
    };

    const createInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/recruitment/interviews', interviewForm);
            toast.success('Interview scheduled');
            setShowInterviewForm(false);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to schedule interview');
        }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm('Delete this job offer?')) return;
        try { await api.delete(`/recruitment/offers/${id}`); toast.success('Deleted'); loadData(); }
        catch (error) { toast.error('Delete failed'); }
    };

    const deleteCandidate = async (id) => {
        if (!window.confirm('Delete this candidate?')) return;
        try { await api.delete(`/recruitment/candidates/${id}`); toast.success('Deleted'); loadData(); }
        catch (error) { toast.error('Delete failed'); }
    };

    const updateApplicationStatus = async (id, status) => {
        try { await api.post(`/recruitment/applications/${id}/status`, { status }); toast.success('Status updated'); loadData(); }
        catch (error) { toast.error('Update failed'); }
    };

    const deleteInterview = async (id) => {
        if (!window.confirm('Cancel this interview?')) return;
        try { await api.delete(`/recruitment/interviews/${id}`); toast.success('Cancelled'); loadData(); }
        catch (error) { toast.error('Cancel failed'); }
    };

    const offerStatusColors = { draft: 'bg-gray-100 text-gray-800', published: 'bg-green-100 text-green-800', closed: 'bg-red-100 text-red-800', archived: 'bg-blue-100 text-blue-800' };
    const appStatusColors = { new: 'bg-blue-100 text-blue-800', screening: 'bg-purple-100 text-purple-800', shortlisted: 'bg-yellow-100 text-yellow-800', interview: 'bg-indigo-100 text-indigo-800', offered: 'bg-green-100 text-green-800', accepted: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' };
    const interviewStatusColors = { scheduled: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800', no_show: 'bg-gray-100 text-gray-800' };
    const typeColors = { full_time: 'bg-green-100 text-green-800', part_time: 'bg-yellow-100 text-yellow-800', contract: 'bg-blue-100 text-blue-800', internship: 'bg-purple-100 text-purple-800', freelance: 'bg-pink-100 text-pink-800' };

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Recruitment</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage job offers, candidates, and interviews</p>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{offers.length}</p>
                    <p className="text-sm text-slate-500">Job Offers</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-blue-600">{candidates.length}</p>
                    <p className="text-sm text-slate-500">Candidates</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-indigo-600">{applications.length}</p>
                    <p className="text-sm text-slate-500">Applications</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-purple-600">{interviews.length}</p>
                    <p className="text-sm text-slate-500">Interviews</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
                {['offers', 'candidates', 'applications', 'interviews'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{tab}</button>
                ))}
            </div>

            {/* Job Offers */}
            {activeTab === 'offers' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowOfferForm(!showOfferForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <FiPlus /> New Offer
                        </button>
                    </div>
                    {showOfferForm && (
                        <form onSubmit={createOffer} className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="Title" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                <input type="text" placeholder="Department" value={offerForm.department} onChange={e => setOfferForm({...offerForm, department: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="text" placeholder="Location" value={offerForm.location} onChange={e => setOfferForm({...offerForm, location: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <select value={offerForm.employment_type} onChange={e => setOfferForm({...offerForm, employment_type: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white">
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                    <option value="freelance">Freelance</option>
                                </select>
                                <input type="number" placeholder="Min Salary" value={offerForm.salary_min} onChange={e => setOfferForm({...offerForm, salary_min: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="number" placeholder="Max Salary" value={offerForm.salary_max} onChange={e => setOfferForm({...offerForm, salary_max: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="number" placeholder="Openings" value={offerForm.openings} onChange={e => setOfferForm({...offerForm, openings: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="date" value={offerForm.closing_date} onChange={e => setOfferForm({...offerForm, closing_date: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                            </div>
                            <textarea placeholder="Description" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white mt-4" rows={3}></textarea>
                            <textarea placeholder="Requirements" value={offerForm.requirements} onChange={e => setOfferForm({...offerForm, requirements: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white mt-2" rows={3}></textarea>
                            <div className="flex gap-2 mt-4">
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                                <button type="button" onClick={() => setShowOfferForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                            </div>
                        </form>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Title</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Department</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Type</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map(offer => (
                                    <tr key={offer.id} className="border-t border-slate-100 dark:border-slate-700">
                                        <td className="p-3"><p className="text-sm font-medium text-slate-800 dark:text-white">{offer.title}</p><p className="text-xs text-slate-500">{offer.location || '-'}</p></td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{offer.department || '-'}</td>
                                        <td className="p-3 hidden md:table-cell"><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[offer.employment_type]}`}>{offer.employment_type?.replace('_', ' ')}</span></td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${offerStatusColors[offer.status]}`}>{offer.status}</span></td>
                                        <td className="p-3 text-right"><button onClick={() => deleteOffer(offer.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {offers.length === 0 && <div className="p-8 text-center text-slate-500">No job offers found</div>}
                    </div>
                </>
            )}

            {/* Candidates */}
            {activeTab === 'candidates' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowCandidateForm(!showCandidateForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <FiPlus /> New Candidate
                        </button>
                    </div>
                    {showCandidateForm && (
                        <form onSubmit={createCandidate} className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="First Name" value={candidateForm.first_name} onChange={e => setCandidateForm({...candidateForm, first_name: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                <input type="text" placeholder="Last Name" value={candidateForm.last_name} onChange={e => setCandidateForm({...candidateForm, last_name: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                <input type="email" placeholder="Email" value={candidateForm.email} onChange={e => setCandidateForm({...candidateForm, email: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                <input type="text" placeholder="Phone" value={candidateForm.phone} onChange={e => setCandidateForm({...candidateForm, phone: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="text" placeholder="Current Position" value={candidateForm.current_position} onChange={e => setCandidateForm({...candidateForm, current_position: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="number" placeholder="Expected Salary" value={candidateForm.expected_salary} onChange={e => setCandidateForm({...candidateForm, expected_salary: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="file" onChange={e => setCandidateFile(e.target.files[0])} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" accept=".pdf,.doc,.docx" />
                                <input type="text" placeholder="LinkedIn URL" value={candidateForm.linkedin} onChange={e => setCandidateForm({...candidateForm, linkedin: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                            </div>
                            <textarea placeholder="Summary" value={candidateForm.summary} onChange={e => setCandidateForm({...candidateForm, summary: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white mt-4" rows={2}></textarea>
                            <div className="flex gap-2 mt-4">
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                                <button type="button" onClick={() => setShowCandidateForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                            </div>
                        </form>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Email</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Position</th>
                                    <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map(c => (
                                    <tr key={c.id} className="border-t border-slate-100 dark:border-slate-700">
                                        <td className="p-3"><p className="text-sm font-medium text-slate-800 dark:text-white">{c.first_name} {c.last_name}</p><p className="text-xs text-slate-500">{c.phone || '-'}</p></td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{c.email}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{c.current_position || '-'}</td>
                                        <td className="p-3 text-right"><button onClick={() => deleteCandidate(c.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {candidates.length === 0 && <div className="p-8 text-center text-slate-500">No candidates found</div>}
                    </div>
                </>
            )}

            {/* Applications */}
            {activeTab === 'applications' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Candidate</th>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Job Offer</th>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app.id} className="border-t border-slate-100 dark:border-slate-700">
                                    <td className="p-3"><p className="text-sm font-medium text-slate-800 dark:text-white">{app.candidate?.first_name} {app.candidate?.last_name}</p></td>
                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{app.job_offer?.title || '-'}</td>
                                    <td className="p-3">
                                        <select value={app.status} onChange={e => updateApplicationStatus(app.id, e.target.value)} className={`px-2 py-1 rounded-full text-xs font-medium ${appStatusColors[app.status]}`}>
                                            {['new', 'screening', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3 text-sm text-slate-500 hidden md:table-cell">{new Date(app.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {applications.length === 0 && <div className="p-8 text-center text-slate-500">No applications found</div>}
                </div>
            )}

            {/* Interviews */}
            {activeTab === 'interviews' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowInterviewForm(!showInterviewForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <FiPlus /> Schedule Interview
                        </button>
                    </div>
                    {showInterviewForm && (
                        <form onSubmit={createInterview} className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select value={interviewForm.application_id} onChange={e => setInterviewForm({...interviewForm, application_id: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required>
                                    <option value="">Select Application</option>
                                    {applications.map(a => <option key={a.id} value={a.id}>{a.candidate?.first_name} {a.candidate?.last_name} - {a.job_offer?.title}</option>)}
                                </select>
                                <select value={interviewForm.interviewer_id} onChange={e => setInterviewForm({...interviewForm, interviewer_id: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required>
                                    <option value="">Select Interviewer</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <select value={interviewForm.type} onChange={e => setInterviewForm({...interviewForm, type: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white">
                                    <option value="phone">Phone</option>
                                    <option value="video">Video</option>
                                    <option value="in_person">In Person</option>
                                </select>
                                <input type="datetime-local" value={interviewForm.scheduled_at} onChange={e => setInterviewForm({...interviewForm, scheduled_at: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" required />
                                <input type="text" placeholder="Location" value={interviewForm.location} onChange={e => setInterviewForm({...interviewForm, location: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                                <input type="url" placeholder="Meeting Link" value={interviewForm.meeting_link} onChange={e => setInterviewForm({...interviewForm, meeting_link: e.target.value})} className="p-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Schedule</button>
                                <button type="button" onClick={() => setShowInterviewForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancel</button>
                            </div>
                        </form>
                    )}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Candidate</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Date</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Type</th>
                                    <th className="text-left p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                    <th className="text-right p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interviews.map(i => (
                                    <tr key={i.id} className="border-t border-slate-100 dark:border-slate-700">
                                        <td className="p-3"><p className="text-sm font-medium text-slate-800 dark:text-white">{i.application?.candidate?.first_name} {i.application?.candidate?.last_name}</p><p className="text-xs text-slate-500">{i.application?.job_offer?.title}</p></td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{new Date(i.scheduled_at).toLocaleString()}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell capitalize">{i.type}</td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${interviewStatusColors[i.status]}`}>{i.status}</span></td>
                                        <td className="p-3 text-right"><button onClick={() => deleteInterview(i.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><FiTrash2 /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {interviews.length === 0 && <div className="p-8 text-center text-slate-500">No interviews found</div>}
                    </div>
                </>
            )}
        </div>
    );
};

export default RecruitmentPage;
