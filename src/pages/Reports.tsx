import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

interface ReportResponse {
    reportId: string;
    reporterName: string;
    reporterPhone: string;
    targetType: string;
    targetId: string;
    targetSummary: string;
    reason: string;
    description: string | null;
    status: string;
    adminNote: string | null;
    resolvedByName: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

export const Reports = () => {
    const [reports, setReports] = useState<ReportResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    
    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Detail drawer state
    const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Action modal state
    const [actionModal, setActionModal] = useState<{ isOpen: boolean; reportId: string | null; action: 'resolve' | 'dismiss' | null }>({ isOpen: false, reportId: null, action: null });
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReports();
    }, [currentPage, pageSize, statusFilter]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const url = `/admin/reports?page=${currentPage}&size=${pageSize}${statusFilter ? `&status=${statusFilter}` : ''}`;
            const response = await api.get(url);
            const data = response.data;
            const content = data.content || data;
            setReports(Array.isArray(content) ? content : []);
            
            if (data.page && data.page.totalPages !== undefined) {
                setTotalPages(data.page.totalPages);
                setTotalElements(data.page.totalElements);
            } else if (data.totalPages !== undefined) {
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            } else {
                setTotalPages(1);
                setTotalElements(Array.isArray(content) ? content.length : 0);
            }
            setError(null);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("فشل في تحميل البلاغات. يرجى التحقق من اتصال الخادم.");
        } finally {
            setIsLoading(false);
        }
    };

    const translateTargetType = (type: string) => {
        switch (type) {
            case 'REVIEW': return 'تقييم';
            case 'JOB': return 'طلب';
            case 'USER': return 'مستخدم';
            default: return type;
        }
    };

    const getTargetTypeColor = (type: string) => {
        switch (type) {
            case 'REVIEW': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'JOB': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            case 'USER': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'PENDING': return 'معلق';
            case 'UNDER_REVIEW': return 'قيد المراجعة';
            case 'RESOLVED': return 'تم الحل';
            case 'DISMISSED': return 'مرفوض';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'UNDER_REVIEW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'DISMISSED': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const translateReason = (reason: string) => {
        switch (reason) {
            case 'INAPPROPRIATE_CONTENT': return 'محتوى غير لائق';
            case 'SPAM': return 'محتوى مزعج (سبام)';
            case 'FRAUD': return 'احتيال';
            case 'HARASSMENT': return 'تحرش أو إساءة';
            case 'FAKE_REVIEW': return 'تقييم مزيف';
            case 'UNPROFESSIONAL_BEHAVIOR': return 'سلوك غير مهني';
            case 'OTHER': return 'سبب آخر';
            default: return reason;
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('ar-SY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const handleViewDetails = (report: ReportResponse) => {
        setSelectedReport(report);
        setIsDrawerOpen(true);
    };

    const handleActionClick = (reportId: string, action: 'resolve' | 'dismiss') => {
        setAdminNote('');
        setActionModal({ isOpen: true, reportId, action });
    };

    const handleActionSubmit = async () => {
        if (!actionModal.reportId || !actionModal.action) return;
        setIsSubmitting(true);
        setError(null);

        try {
            await api.patch(`/admin/reports/${actionModal.reportId}/${actionModal.action}`, {
                adminNote: adminNote || null
            });
            
            // Refresh list and close modal
            setActionModal({ isOpen: false, reportId: null, action: null });
            
            // Close drawer if open and modifying the same report
            if (isDrawerOpen && selectedReport?.reportId === actionModal.reportId) {
                setIsDrawerOpen(false);
            }
            
            fetchReports();
        } catch (err: any) {
            console.error("Failed to perform action on report:", err);
            setError("حدث خطأ أثناء محاولة تحديث حالة البلاغ.");
            setActionModal({ isOpen: false, reportId: null, action: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout title="إدارة البلاغات">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">إدارة البلاغات</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">مراجعة ومعالجة البلاغات المقدمة من المستخدمين.</p>
                </div>
                <div className="flex gap-3">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }} 
                        className="px-4 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface font-label-md outline-none cursor-pointer"
                    >
                        <option value="">الكل</option>
                        <option value="PENDING">معلق</option>
                        <option value="UNDER_REVIEW">قيد المراجعة</option>
                        <option value="RESOLVED">تم الحل</option>
                        <option value="DISMISSED">مرفوض</option>
                    </select>
                    <button 
                        onClick={() => { setCurrentPage(0); fetchReports(); }} 
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                        تحديث
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">إجمالي البلاغات: {totalElements}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-label-sm text-on-surface-variant">عدد العناصر بالصفحة:</span>
                        <select 
                            value={pageSize} 
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }} 
                            className="p-1 border border-outline-variant rounded-md bg-surface text-on-surface font-label-sm outline-none cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto w-full min-h-[300px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 z-20">
                            <span className="text-primary font-label-md flex items-center gap-2">
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                جاري التحميل...
                            </span>
                        </div>
                    )}

                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant">
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">المُبلِّغ</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">نوع البلاغ</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">الهدف</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">السبب</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">الحالة</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">التاريخ</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {reports.map((report) => (
                                <tr key={report.reportId} className="border-b border-outline-variant hover:bg-primary-container/5 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-label-md text-on-surface">{report.reporterName}</span>
                                            <span className="font-body-sm text-on-surface-variant font-mono" dir="ltr">{report.reporterPhone}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getTargetTypeColor(report.targetType)}`}>
                                            {translateTargetType(report.targetType)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant max-w-xs truncate" title={report.targetSummary}>
                                        {report.targetSummary}
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {translateReason(report.reason)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(report.status)}`}>
                                            {translateStatus(report.status)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {formatDate(report.createdAt)}
                                    </td>
                                    <td className="py-4 px-6 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleViewDetails(report)}
                                                className="text-primary hover:bg-primary-container/50 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                            >
                                                عرض
                                            </button>
                                            {report.status === 'PENDING' && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleActionClick(report.reportId, 'resolve')}
                                                        className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                                        title="حل البلاغ"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleActionClick(report.reportId, 'dismiss')}
                                                        className="text-zinc-400 hover:bg-zinc-500/10 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                                        title="رفض البلاغ"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد بلاغات متاحة حالياً.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <div className="font-body-sm text-on-surface-variant">
                        إجمالي العناصر: {totalElements}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 0 || isLoading}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 border border-outline-variant rounded-md disabled:opacity-50 hover:bg-surface-container-low transition-colors text-on-surface flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <span className="font-label-md text-on-surface px-4">
                            صفحة {currentPage + 1} من {totalPages || 1}
                        </span>
                        <button 
                            disabled={currentPage >= totalPages - 1 || isLoading}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-outline-variant rounded-md disabled:opacity-50 hover:bg-surface-container-low transition-colors text-on-surface flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* DETAIL SLIDE-OUT DRAWER */}
            {isDrawerOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">تفاصيل البلاغ</h3>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(selectedReport.status)}`}>
                                    {translateStatus(selectedReport.status)}
                                </span>
                                <h2 className="font-h2 text-on-surface mt-3 leading-tight">{translateReason(selectedReport.reason)}</h2>
                                <p className="font-body-sm text-on-surface-variant mt-1 font-mono text-xs">ID: {selectedReport.reportId}</p>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">المُبلِّغ</label>
                                    <p className="font-body-md text-on-surface mt-1">
                                        {selectedReport.reporterName} <span className="font-mono text-sm" dir="ltr">({selectedReport.reporterPhone})</span>
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">الهدف (<span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getTargetTypeColor(selectedReport.targetType)}`}>{translateTargetType(selectedReport.targetType)}</span>)</label>
                                    <p className="font-body-md text-on-surface mt-1 bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
                                        {selectedReport.targetSummary}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">التفاصيل الإضافية</label>
                                    <p className="font-body-md text-on-surface mt-1">
                                        {selectedReport.description || 'لم يتم تقديم تفاصيل إضافية.'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">التاريخ والوقت</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                                        {formatDate(selectedReport.createdAt)}
                                    </p>
                                </div>
                                
                                {selectedReport.status !== 'PENDING' && (
                                    <>
                                        <div className="w-full h-px bg-outline-variant/50 my-2"></div>
                                        <div>
                                            <label className="font-label-sm text-on-surface-variant">ملاحظة الإدارة</label>
                                            <p className="font-body-md text-on-surface mt-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/50 italic">
                                                {selectedReport.adminNote || 'لا توجد ملاحظة.'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-label-sm text-on-surface-variant">تم المعالجة بواسطة</label>
                                            <p className="font-body-md text-on-surface mt-1">
                                                {selectedReport.resolvedByName} في {selectedReport.resolvedAt ? formatDate(selectedReport.resolvedAt) : ''}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {selectedReport.status === 'PENDING' && (
                            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleActionClick(selectedReport.reportId, 'dismiss')}
                                        className="flex-1 py-2.5 px-4 rounded-lg font-label-md transition-colors border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low cursor-pointer"
                                    >
                                        رفض البلاغ
                                    </button>
                                    <button 
                                        onClick={() => handleActionClick(selectedReport.reportId, 'resolve')}
                                        className="flex-1 py-2.5 px-4 rounded-lg font-label-md transition-colors bg-primary text-on-primary hover:bg-primary/90 cursor-pointer"
                                    >
                                        حل البلاغ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ACTION CONFIRMATION MODAL */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant p-6 animate-fade-in">
                        <div className={`flex items-center gap-3 mb-4 ${actionModal.action === 'resolve' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            <span className="material-symbols-outlined text-[32px]">
                                {actionModal.action === 'resolve' ? 'check_circle' : 'cancel'}
                            </span>
                            <h3 className="font-h3 text-h3 text-on-surface">
                                {actionModal.action === 'resolve' ? 'تأكيد حل البلاغ' : 'تأكيد رفض البلاغ'}
                            </h3>
                        </div>
                        <p className="mb-4 font-body-md text-on-surface-variant">
                            {actionModal.action === 'resolve' 
                                ? 'هل أنت متأكد من حل هذا البلاغ؟ سيتم إشعار المُبلِّغ بذلك.' 
                                : 'هل أنت متأكد من رفض هذا البلاغ؟ سيتم إشعار المُبلِّغ بذلك.'}
                        </p>
                        
                        <div className="mb-6">
                            <label className="block font-label-sm text-on-surface-variant mb-2">ملاحظة للإدارة (اختياري)</label>
                            <textarea 
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-y"
                                placeholder="أضف تفاصيل حول سبب الحل أو الرفض..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setActionModal({ isOpen: false, reportId: null, action: null })} 
                                disabled={isSubmitting} 
                                className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-variant disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={handleActionSubmit} 
                                disabled={isSubmitting} 
                                className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 disabled:opacity-50 ${actionModal.action === 'resolve' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-zinc-600 text-white hover:bg-zinc-700'}`}
                            >
                                {isSubmitting ? 'جاري المعالجة...' : 'تأكيد'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
