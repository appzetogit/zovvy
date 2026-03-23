import React, { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    Eye,
    Mail,
    MessageSquare,
    Phone,
    Search,
    UserRound,
    X
} from 'lucide-react';
import {
    useContactSubmissions,
    useUpdateContactSubmissionStatus
} from '../../../hooks/useContactSubmissions';
import {
    AdminTable,
    AdminTableBody,
    AdminTableCell,
    AdminTableHead,
    AdminTableHeader,
    AdminTableRow
} from '../components/AdminTable';

const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
};

const getStatusClasses = (status) => (
    status === 'resolved'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-amber-50 text-amber-700 border-amber-100'
);

const normalizeStatus = (status) => status || 'pending';

const getVisiblePages = (currentPage, totalPages) => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
        pages.push(i);
    }

    return pages;
};

const ContactSubmissionsPage = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const limit = 12;

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isError, error } = useContactSubmissions({
        page,
        limit,
        status: statusFilter,
        search
    });
    const updateStatusMutation = useUpdateContactSubmissionStatus();

    const submissions = data?.submissions || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

    useEffect(() => {
        if (selectedSubmission?._id) {
            const freshItem = submissions.find((item) => item._id === selectedSubmission._id);
            if (freshItem) {
                setSelectedSubmission(freshItem);
            }
        }
    }, [submissions, selectedSubmission?._id]);

    const stats = useMemo(() => ({
        total: pagination.total || 0,
        pending: submissions.filter((item) => normalizeStatus(item.status) === 'pending').length,
        resolved: submissions.filter((item) => normalizeStatus(item.status) === 'resolved').length
    }), [pagination.total, submissions]);
    const visiblePages = useMemo(
        () => getVisiblePages(pagination.page || 1, pagination.pages || 1),
        [pagination.page, pagination.pages]
    );

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
        setPage(1);
    };

    const handleUpdateStatus = async (submission, status) => {
        await updateStatusMutation.mutateAsync({ id: submission._id, status });
        if (selectedSubmission?._id === submission._id) {
            setSelectedSubmission((prev) => prev ? { ...prev, status } : prev);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">Contact Form Submissions</h1>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Compact view of messages received from the website contact form</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-footerBg">
                        <MessageSquare size={16} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Total</span>
                    </div>
                    <p className="text-2xl font-black text-[#1a1a1a] mt-3">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600">
                        <CalendarDays size={16} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Pending On Page</span>
                    </div>
                    <p className="text-2xl font-black text-[#1a1a1a] mt-3">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Mail size={16} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Resolved On Page</span>
                    </div>
                    <p className="text-2xl font-black text-[#1a1a1a] mt-3">{stats.resolved}</p>
                </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by name, phone, email, or message"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-700 outline-none focus:border-black transition-all"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-black transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-sm text-gray-400">Loading contact submissions...</div>
                ) : isError ? (
                    <div className="py-16 text-center text-sm text-red-500">{error?.message || 'Failed to load contact submissions.'}</div>
                ) : submissions.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400">No contact form submissions found for the current filter.</div>
                ) : (
                    <>
                        <AdminTable className="pb-0">
                            <AdminTableHeader>
                                <AdminTableHead width="20%">Contact</AdminTableHead>
                                <AdminTableHead width="20%">Phone</AdminTableHead>
                                <AdminTableHead width="18%">Status</AdminTableHead>
                                <AdminTableHead width="20%">Submitted</AdminTableHead>
                                <AdminTableHead width="10%" className="text-right">View</AdminTableHead>
                            </AdminTableHeader>
                            <AdminTableBody>
                                {submissions.map((submission) => (
                                    <AdminTableRow key={submission._id}>
                                        <AdminTableCell className="py-3">
                                            <div className="flex items-start gap-3 min-w-[220px]">
                                                <div className="w-8 h-8 rounded-xl bg-gray-100 text-footerBg flex items-center justify-center shrink-0 mt-0.5">
                                                    <UserRound size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#1a1a1a] truncate">{submission.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{submission.email}</p>
                                                </div>
                                            </div>
                                        </AdminTableCell>
                                        <AdminTableCell className="py-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone size={14} className="text-gray-400 shrink-0" />
                                                <span>{submission.phone}</span>
                                            </div>
                                        </AdminTableCell>
                                        <AdminTableCell className="py-3">
                                            <select
                                                value={normalizeStatus(submission.status)}
                                                onChange={(event) => handleUpdateStatus(submission, event.target.value)}
                                                disabled={updateStatusMutation.isPending}
                                                className={`min-w-[120px] rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest outline-none transition-all ${getStatusClasses(normalizeStatus(submission.status))}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </AdminTableCell>
                                        <AdminTableCell className="py-3">
                                            <span className="text-xs font-semibold text-gray-500 whitespace-normal">
                                                {formatDateTime(submission.createdAt)}
                                            </span>
                                        </AdminTableCell>
                                        <AdminTableCell className="py-3 text-right">
                                            <button
                                                onClick={() => setSelectedSubmission(submission)}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:text-black hover:border-gray-300 hover:bg-gray-50 transition-all"
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </AdminTableCell>
                                    </AdminTableRow>
                                ))}
                            </AdminTableBody>
                        </AdminTable>

                        {pagination.pages > 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    Prev
                                </button>
                                {visiblePages[0] > 1 && (
                                    <>
                                        <button
                                            onClick={() => setPage(1)}
                                            className="w-10 h-10 rounded-xl border border-gray-100 text-xs font-black hover:bg-gray-50 transition-all"
                                        >
                                            1
                                        </button>
                                        {visiblePages[0] > 2 && (
                                            <span className="px-1 text-xs font-bold text-gray-400">...</span>
                                        )}
                                    </>
                                )}
                                {visiblePages.map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setPage(pageNumber)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                            pagination.page === pageNumber
                                                ? 'bg-black text-white shadow-lg'
                                                : 'border border-gray-100 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                                {visiblePages[visiblePages.length - 1] < pagination.pages && (
                                    <>
                                        {visiblePages[visiblePages.length - 1] < pagination.pages - 1 && (
                                            <span className="px-1 text-xs font-bold text-gray-400">...</span>
                                        )}
                                        <button
                                            onClick={() => setPage(pagination.pages)}
                                            className="w-10 h-10 rounded-xl border border-gray-100 text-xs font-black hover:bg-gray-50 transition-all"
                                        >
                                            {pagination.pages}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                                    disabled={page === pagination.pages}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] p-4 md:p-6 flex justify-end">
                    <div className="w-full max-w-xl bg-white rounded-[2rem] border border-gray-100 shadow-2xl h-full max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-black text-[#1a1a1a] uppercase tracking-tight">Submission Details</h2>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">View full message and update status</p>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-88px)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xl font-black text-[#1a1a1a]">{selectedSubmission.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">{selectedSubmission.email}</p>
                                </div>
                                <span className={`inline-flex items-center px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${getStatusClasses(normalizeStatus(selectedSubmission.status))}`}>
                                    {normalizeStatus(selectedSubmission.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Phone</p>
                                    <p className="text-sm font-semibold text-[#1a1a1a] break-words">{selectedSubmission.phone}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Submitted</p>
                                    <p className="text-sm font-semibold text-[#1a1a1a] break-words">{formatDateTime(selectedSubmission.createdAt)}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Message</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{selectedSubmission.message}</p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactSubmissionsPage;
