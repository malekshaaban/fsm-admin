import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

interface AdminSummary {
    userId: string;
    name: string;
    surname: string;
    phoneNo: string;
    role: string;
}

interface AuditLog {
    logId: string;
    admin: AdminSummary;
    action: string;
    targetTable: string;
    targetId: string;
    details: string;
    ipAddress: string | null;
    createdAt: string;
}

export const Logs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Detail drawer state
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/admin/logs?page=${currentPage}&size=${pageSize}`);
                const data = response.data;
                setLogs(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch audit logs:", err);
                setError("فشل في تحميل سجل العمليات. يرجى التحقق من اتصال الخادم.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [currentPage, pageSize]);

    const translateAction = (action: string) => {
        switch (action) {
            case 'BAN_USER': return 'حظر مستخدم';
            case 'ACTIVATE_USER': return 'تنشيط مستخدم';
            case 'UPDATE_ROLE': return 'تعديل الدور';
            case 'FORCE_CANCEL_JOB': return 'إلغاء وظيفة إجبارياً';
            case 'DELETE_REVIEW': return 'حذف تقييم';
            default: return action;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'BAN_USER': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30';
            case 'ACTIVATE_USER': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30';
            case 'UPDATE_ROLE': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30';
            case 'FORCE_CANCEL_JOB': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/30';
            case 'DELETE_REVIEW': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/30';
        }
    };

    const translateTargetTable = (table: string) => {
        switch (table) {
            case 'users': return 'المستخدمين';
            case 'jobs': return 'الوظائف';
            case 'reviews': return 'التقييمات';
            default: return table;
        }
    };

    const translateRole = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'مسؤول';
            case 'TECHNICIAN': return 'فني';
            case 'CUSTOMER': return 'عميل';
            default: return role;
        }
    };

    const translateJobStatus = (status: string) => {
        switch (status) {
            case 'OPEN': return 'مفتوحة';
            case 'ASSIGNED': return 'معينة';
            case 'IN_PROGRESS': return 'قيد التنفيذ';
            case 'COMPLETED': return 'مكتملة';
            case 'CANCELLED': return 'ملغاة';
            case 'EXPIRED': return 'منتهية';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('ar-SY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(dateString));
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setIsDrawerOpen(true);
    };

    const renderFormattedDetails = (log: AuditLog) => {
        try {
            const details = JSON.parse(log.details);
            
            if (log.action === 'BAN_USER' || log.action === 'ACTIVATE_USER') {
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                            <span className="text-on-surface-variant font-label-sm">رقم هاتف المستخدم:</span>
                            <span className="font-mono text-on-surface font-semibold" dir="ltr">{details.userPhone}</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                            <span className="text-on-surface-variant font-label-sm">الحالة السابقة:</span>
                            <span className="text-error font-semibold">{details.previousStatus === 'ACTIVE' ? 'نشط' : 'محظور'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant font-label-sm">الحالة الجديدة:</span>
                            <span className="text-success font-semibold">{details.newStatus === 'ACTIVE' ? 'نشط' : 'محظور'}</span>
                        </div>
                    </div>
                );
            }

            if (log.action === 'UPDATE_ROLE') {
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                            <span className="text-on-surface-variant font-label-sm">رقم هاتف المستخدم:</span>
                            <span className="font-mono text-on-surface font-semibold" dir="ltr">{details.userPhone}</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                            <span className="text-on-surface-variant font-label-sm">الدور السابق:</span>
                            <span className="text-on-surface-variant font-semibold">{translateRole(details.previousRole)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant font-label-sm">الدور الجديد:</span>
                            <span className="text-primary font-semibold">{translateRole(details.newRole)}</span>
                        </div>
                    </div>
                );
            }

            if (log.action === 'FORCE_CANCEL_JOB') {
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                            <span className="text-on-surface-variant font-label-sm">الحالة السابقة للوظيفة:</span>
                            <span className="text-on-surface-variant font-semibold">{translateJobStatus(details.previousStatus)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant font-label-sm">الحالة الجديدة:</span>
                            <span className="text-error font-semibold">{translateJobStatus(details.newStatus)}</span>
                        </div>
                    </div>
                );
            }

            if (log.action === 'DELETE_REVIEW') {
                return (
                    <p className="text-on-surface-variant font-body-md leading-relaxed">
                        تم حذف هذا التقييم بشكل نهائي ودائم من قاعدة البيانات لمنع التعليقات غير اللائقة أو المضللة.
                    </p>
                );
            }

            // Fallback for custom or unmapped details
            return (
                <pre className="text-xs font-mono bg-surface-container-low p-3 rounded-lg border border-outline-variant/50 overflow-x-auto text-left" dir="ltr">
                    {JSON.stringify(details, null, 2)}
                </pre>
            );
        } catch {
            return <span className="text-on-surface-variant">{log.details || 'لا توجد تفاصيل إضافية.'}</span>;
        }
    };

    return (
        <AdminLayout title="سجل العمليات">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">سجل العمليات والتدقيق</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">تتبع وإجراءات رقابة المشرفين والمسؤولين على المنصة.</p>
                </div>
                <button 
                    onClick={() => { setCurrentPage(0); }} 
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                    <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                    تحديث السجل
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">إجمالي السجلات: {totalElements}</span>
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
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">معرف السجل</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">المسؤول</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">نوع الإجراء</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">الجدول المستهدف</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">عنوان IP</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">التاريخ والوقت</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-left">التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {logs.map((log) => (
                                <tr key={log.logId} className="border-b border-outline-variant hover:bg-primary-container/5 transition-colors group">
                                    <td className="py-4 px-6 font-medium text-xs font-mono">
                                        <span title={log.logId} className="cursor-help">...{log.logId.slice(-6).toUpperCase()}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-label-md text-on-surface">{log.admin.name} {log.admin.surname}</span>
                                            <span className="font-body-sm text-on-surface-variant font-mono" dir="ltr">{log.admin.phoneNo}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(log.action)}`}>
                                            {translateAction(log.action)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {translateTargetTable(log.targetTable)}
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant font-mono" dir="ltr">
                                        {log.ipAddress || '---'}
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td className="py-4 px-6 text-left">
                                        <button 
                                            onClick={() => handleViewDetails(log)}
                                            className="text-primary hover:bg-primary-container/50 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                        >
                                            عرض
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد سجلات عمليات متاحة حالياً.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low/40">
                        <span className="font-body-sm text-on-surface-variant">
                            الصفحة {currentPage + 1} من {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                                disabled={currentPage === 0} 
                                className="p-2 border border-outline-variant rounded-lg bg-surface text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                                disabled={currentPage === totalPages - 1} 
                                className="p-2 border border-outline-variant rounded-lg bg-surface text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DETAIL SLIDE-OUT DRAWER */}
            {isDrawerOpen && selectedLog && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">تفاصيل الإجراء</h3>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getActionColor(selectedLog.action)}`}>
                                    {translateAction(selectedLog.action)}
                                </span>
                                <h2 className="font-h2 text-on-surface mt-3 leading-tight">إجراء بواسطة {selectedLog.admin.name} {selectedLog.admin.surname}</h2>
                                <p className="font-body-sm text-on-surface-variant mt-1 font-mono text-xs">ID: {selectedLog.logId}</p>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">الجدول المستهدف</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">table_rows</span>
                                        {translateTargetTable(selectedLog.targetTable)} ({selectedLog.targetTable})
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">معرف المستهدف (Target ID)</label>
                                    <p className="font-body-md text-on-surface mt-1 font-mono text-xs flex items-center gap-2 select-all cursor-help" title="انقر لتحديد المعرف الكامل">
                                        <span className="material-symbols-outlined text-[18px] text-tertiary">fingerprint</span>
                                        {selectedLog.targetId}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">عنوان IP للطلب</label>
                                    <p className="font-body-md text-on-surface mt-1 font-mono flex items-center gap-2" dir="ltr">
                                        <span className="material-symbols-outlined text-[18px] text-primary">lan</span>
                                        {selectedLog.ipAddress || 'غير متوفر'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">التاريخ والوقت</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                                        {formatDate(selectedLog.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            <div>
                                <label className="font-label-sm text-on-surface-variant mb-2 block">بيانات وتفاصيل التغيير</label>
                                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                                    {renderFormattedDetails(selectedLog)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
