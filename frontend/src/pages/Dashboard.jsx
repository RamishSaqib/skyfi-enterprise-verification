import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, CheckCircle, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import ReportModal from '../components/ReportModal';

export default function Dashboard({ token, setToken }) {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [newCompany, setNewCompany] = useState({ name: '', website: '' });
    const [verifying, setVerifying] = useState(false);
    const [filterRisk, setFilterRisk] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const filteredCompanies = companies.filter(company => {
        const matchesRisk = filterRisk === 'all' || company.risk_level === filterRisk;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'verified' && company.verified) ||
            (filterStatus === 'pending' && !company.verified);
        return matchesRisk && matchesStatus;
    }).sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'risk_level') {
            const riskOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
            const rankA = riskOrder[a.risk_level] || 0;
            const rankB = riskOrder[b.risk_level] || 0;
            return sortConfig.direction === 'asc' ? rankA - rankB : rankB - rankA;
        }
        if (sortConfig.key === 'risk_score') {
            return sortConfig.direction === 'asc'
                ? (a.risk_score || 0) - (b.risk_score || 0)
                : (b.risk_score || 0) - (a.risk_score || 0);
        }
        if (sortConfig.key === 'status') {
            const getStatusRank = (c) => {
                if (c.review_status === 'approved') return 1;
                if (c.review_status === 'rejected') return 2;
                if (c.verified) return 3;
                return 4; // Pending
            };
            const rankA = getStatusRank(a);
            const rankB = getStatusRank(b);
            return sortConfig.direction === 'asc' ? rankA - rankB : rankB - rankA;
        }
        return 0;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        if (token) {
            fetchCompanies();
        }
    }, [token]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(`${apiUrl}/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (status) => {
        try {
            await axios.post(`${apiUrl}/companies/${selectedCompany.id}/review?status=${status}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedCompany(null);
            fetchCompanies();
        } catch (error) {
            console.error('Error reviewing company:', error);
        }
    };

    const handleReverify = async () => {
        if (!selectedCompany) return;
        try {
            const response = await axios.post(`${apiUrl}/companies/${selectedCompany.id}/reverify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedCompany(response.data); // Update modal with new data
            fetchCompanies(); // Update list
        } catch (error) {
            console.error('Error re-verifying company:', error);
        }
    };

    const handleUpdate = async (id, data) => {
        try {
            const response = await axios.put(`${apiUrl}/companies/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedCompany(response.data);
            fetchCompanies();
        } catch (error) {
            console.error('Error updating company:', error);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            await axios.post(`${apiUrl}/verify`, newCompany, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setNewCompany({ name: '', website: '' });
            fetchCompanies();
        } catch (error) {
            console.error('Error verifying company:', error);
        } finally {
            setVerifying(false);
        }
    };

    const getRiskBadge = (level) => {
        switch (level) {
            case 'low': return <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">Low Risk</span>;
            case 'medium': return <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-400/20">Medium Risk</span>;
            case 'high': return <span className="inline-flex items-center rounded-md bg-orange-400/10 px-2 py-1 text-xs font-medium text-orange-400 ring-1 ring-inset ring-orange-400/20">High Risk</span>;
            case 'critical': return <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">Critical</span>;
            default: return <span className="inline-flex items-center rounded-md bg-gray-400/10 px-2 py-1 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-400/20">Pending</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">SkyFi Intelligence</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setToken(null)} className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-2">
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold leading-6 text-white">Company Verifications</h1>
                        <p className="mt-2 text-sm text-gray-400">
                            A list of all companies verified by the AI intelligence system.
                        </p>
                    </div>
                    <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
                        <select
                            value={filterRisk}
                            onChange={(e) => setFilterRisk(e.target.value)}
                            className="block rounded-md border-0 bg-gray-700 py-1.5 pl-3 pr-10 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                            <option value="all">All Risks</option>
                            <option value="low">Low Risk</option>
                            <option value="medium">Medium Risk</option>
                            <option value="high">High Risk</option>
                            <option value="critical">Critical</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="block rounded-md border-0 bg-gray-700 py-1.5 pl-3 pr-10 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                            <option value="all">All Statuses</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                        </select>

                        <button
                            onClick={() => setShowModal(true)}
                            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Plus className="h-4 w-4 inline-block mr-1" /> New Verification
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-white/5 sm:rounded-lg bg-gray-900">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-800">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Company
                                                    {sortConfig.key === 'name' && (
                                                        <span className="text-indigo-400 text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Website</th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-white cursor-pointer hover:bg-gray-700/50 transition-colors"
                                                onClick={() => handleSort('risk_level')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Risk Level
                                                    {sortConfig.key === 'risk_level' && (
                                                        <span className="text-indigo-400 text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-white cursor-pointer hover:bg-gray-700/50 transition-colors"
                                                onClick={() => handleSort('risk_score')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Score
                                                    {sortConfig.key === 'risk_score' && (
                                                        <span className="text-indigo-400 text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-white cursor-pointer hover:bg-gray-700/50 transition-colors"
                                                onClick={() => handleSort('status')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Status
                                                    {sortConfig.key === 'status' && (
                                                        <span className="text-indigo-400 text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">View</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700 bg-gray-900">
                                        {loading ? (
                                            <tr><td colSpan="6" className="text-center py-4 text-gray-400">Loading...</td></tr>
                                        ) : filteredCompanies.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-8 text-gray-400">No matching companies found.</td></tr>
                                        ) : (
                                            filteredCompanies.map((company) => (
                                                <tr key={company.id || Math.random()} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0">
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{company.name}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{company.website}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{getRiskBadge(company.risk_level)}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{company.risk_score}/100</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                        {company.review_status === 'approved' ? (
                                                            <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">Approved</span>
                                                        ) : company.review_status === 'rejected' ? (
                                                            <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">Rejected</span>
                                                        ) : company.verified ? (
                                                            <span className="text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Verified</span>
                                                        ) : (
                                                            <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Pending</span>
                                                        )}
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                        <button
                                                            onClick={() => setSelectedCompany(company)}
                                                            className="text-indigo-400 hover:text-indigo-300"
                                                        >
                                                            View<span className="sr-only">, {company.name}</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* New Verification Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-700">
                            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                <button
                                    type="button"
                                    className="rounded-md bg-gray-800 text-gray-400 hover:text-gray-300 focus:outline-none"
                                    onClick={() => setShowModal(false)}
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/10 sm:mx-0 sm:h-10 sm:w-10">
                                    <Search className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-base font-semibold leading-6 text-white">Verify New Company</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-400">
                                            Enter the company details to start the AI verification process.
                                        </p>
                                        <form onSubmit={handleVerify} className="mt-4 space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium leading-6 text-white">Company Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    required
                                                    className="block w-full rounded-md border-0 bg-gray-700 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                                                    value={newCompany.name}
                                                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="website" className="block text-sm font-medium leading-6 text-white">Website</label>
                                                <input
                                                    type="text"
                                                    name="website"
                                                    id="website"
                                                    required
                                                    className="block w-full rounded-md border-0 bg-gray-700 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                                                    value={newCompany.website}
                                                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                                                />
                                            </div>
                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button
                                                    type="submit"
                                                    disabled={verifying}
                                                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {verifying ? 'Analyzing...' : 'Start Verification'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto"
                                                    onClick={() => setShowModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Report Modal */}
            <ReportModal
                company={selectedCompany}
                onClose={() => setSelectedCompany(null)}
                onReview={handleReview}
                onReverify={handleReverify}
                onUpdate={handleUpdate}
            />

        </div >
    );
}
