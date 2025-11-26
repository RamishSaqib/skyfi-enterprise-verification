import { Fragment } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Globe, Calendar, Shield, Database, Mail, Phone } from 'lucide-react';

export default function ReportModal({ company, onClose, onReview, onReverify, onUpdate }) {
    if (!company) return null;

    const riskColor = {
        low: 'text-green-400',
        medium: 'text-yellow-400',
        high: 'text-orange-400',
        critical: 'text-red-400'
    };

    const riskBg = {
        low: 'bg-green-400/10',
        medium: 'bg-yellow-400/10',
        high: 'bg-orange-400/10',
        critical: 'bg-red-400/10'
    };

    const getStatusIcon = (status) => {
        if (status === 'Pass') return <CheckCircle className="h-5 w-5 text-green-400" />;
        if (status === 'Warning') return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
        return <XCircle className="h-5 w-5 text-red-400" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                        type="button"
                        className="rounded-md bg-gray-800 text-gray-400 hover:text-gray-300 focus:outline-none"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="sm:flex sm:items-start w-full">
                    <div className="w-full">
                        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                            <div>
                                <h3 className="text-xl font-semibold leading-6 text-white flex items-center gap-2">
                                    {company.name}
                                    {company.verified && <CheckCircle className="h-5 w-5 text-blue-400" />}
                                </h3>
                                <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> {company.website}
                                </p>
                            </div>
                            <div className={`rounded-full px-3 py-1 ${riskBg[company.risk_level]} border border-${riskColor[company.risk_level].replace('text-', '')}/20`}>
                                <span className={`text-sm font-medium ${riskColor[company.risk_level]}`}>
                                    {company.risk_score}/100 Risk Score
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            {/* Summary */}
                            <div className="rounded-md bg-gray-900/50 p-4 border border-gray-700">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Verification Summary</h4>
                                <p className="text-sm text-gray-400">
                                    {company.report_data?.summary || "Analysis pending..."}
                                </p>
                            </div>

                            {/* Findings */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Detailed Findings</h4>
                                <div className="space-y-3">
                                    {company.report_data?.findings?.map((finding, idx) => (
                                        <div key={idx} className="flex items-start gap-3 rounded-md bg-gray-700/30 p-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getStatusIcon(finding.status)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{finding.source}</p>
                                                <p className="text-sm text-gray-400">{finding.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Verification */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-md bg-gray-700/30 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-white">Email Verification</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {company.report_data?.match_details?.email_verified ? (
                                            <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">Verified</span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">Not Found</span>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-md bg-gray-700/30 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-white">Phone Verification</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {company.report_data?.match_details?.phone_verified ? (
                                            <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">Verified</span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">Not Found</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 border-t border-gray-700 pt-4">
                            <button
                                type="button"
                                className="rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
                                onClick={onReverify}
                            >
                                Re-verify
                            </button>
                            {company.review_status === 'pending' && (
                                <>
                                    <button
                                        type="button"
                                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                                        onClick={() => onReview('rejected')}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                                        onClick={() => onReview('approved')}
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
