import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

interface UserResponse {
    userId: string;
    name: string;
    surname: string;
    phoneNo: string;
    role: string;
}

interface NotificationLog {
    notificationId: string;
    user: UserResponse;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    relatedJobId: string | null;
    metadata: string | null;
    createdAt: string;
}

export const Notifications = () => {
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Detail drawer state
    const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/admin/notifications?page=${currentPage}&size=${pageSize}`);
                const data = response.data;
                setNotifications(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch notification logs:", err);
                setError("فشل في تحميل سجل الإشعارات. يرجى التحقق من اتصال الخادم.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [currentPage, pageSize]);

    const translateType = (type: string) => {
        switch (type) {
            case 'NEW_APPLICATION': return 'تقديم طلب جديد';
            case 'APPLICATION_ACCEPTED': return 'قبول طلب التقديم';
            case 'APPLICATION_REJECTED': return 'رفض طلب التقديم';
            case 'JOB_COMPLETED': return 'إكمال الوظيفة';
            case 'JOB_EXPIRED': return 'انتهاء صلاحية الوظيفة';
            case 'PHONE_REVEALED': return 'كشف رقم الهاتف';
            case 'GENERAL': return 'تنبيه عام';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'NEW_APPLICATION': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30';
            case 'APPLICATION_ACCEPTED': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30';
            case 'APPLICATION_REJECTED': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30';
            case 'JOB_COMPLETED': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30';
            case 'JOB_EXPIRED': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/30';
            case 'PHONE_REVEALED': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/30';
            default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/30';
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

    const handleViewDetails = (notification: NotificationLog) => {
        setSelectedNotification(notification);
        setIsDrawerOpen(true);
    };

    return (
        <AdminLayout title="سجل الإشعارات">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">سجل الإشعارات والتنبيهات</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">تتبع التنبيهات ورسائل النظام المرسلة للمستخدمين على المنصة.</p>
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
                    <span className="font-body-sm text-body-sm text-on-surface-variant">إجمالي التنبيهات: {totalElements}</span>
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
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">معرف التنبيه</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">المستلم</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">نوع الإشعار</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">عنوان الإشعار</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">التفاصيل / النص</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">تاريخ الإرسال</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-left">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {notifications.map((notif) => (
                                <tr key={notif.notificationId} className="border-b border-outline-variant hover:bg-primary-container/5 transition-colors group">
                                    <td className="py-4 px-6 font-medium text-xs font-mono">
                                        <span title={notif.notificationId} className="cursor-help">...{notif.notificationId.slice(-6).toUpperCase()}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-label-md text-on-surface">{notif.user.name} {notif.user.surname}</span>
                                            <span className="font-body-sm text-on-surface-variant font-mono" dir="ltr">{notif.user.phoneNo}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getTypeColor(notif.type)}`}>
                                            {translateType(notif.type)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-label-md text-on-surface max-w-[150px] truncate">
                                        {notif.title}
                                    </td>
                                    <td className="py-4 px-6 font-body-sm text-on-surface-variant max-w-[200px] truncate">
                                        {notif.body || '---'}
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {formatDate(notif.createdAt)}
                                    </td>
                                    <td className="py-4 px-6 text-left">
                                        <button 
                                            onClick={() => handleViewDetails(notif)}
                                            className="text-primary hover:bg-primary-container/50 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                        >
                                            عرض
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {notifications.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد تنبيهات مرسلة حالياً.
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
            {isDrawerOpen && selectedNotification && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">تفاصيل التنبيه</h3>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getTypeColor(selectedNotification.type)}`}>
                                    {translateType(selectedNotification.type)}
                                </span>
                                <h2 className="font-h2 text-on-surface mt-3 leading-tight">{selectedNotification.title}</h2>
                                <p className="font-body-sm text-on-surface-variant mt-1 font-mono text-xs">ID: {selectedNotification.notificationId}</p>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">المستلم</label>
                                    <div className="flex items-center gap-3 mt-1.5 p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
                                        <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold font-label-md">
                                            {selectedNotification.user.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-label-md text-on-surface">{selectedNotification.user.name} {selectedNotification.user.surname}</span>
                                            <span className="font-body-sm text-on-surface-variant flex items-center gap-1 font-mono" dir="ltr">
                                                <span className="material-symbols-outlined text-xs">call</span>
                                                {selectedNotification.user.phoneNo}
                                            </span>
                                        </div>
                                        <span className="mr-auto text-xs px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant">
                                            {translateRole(selectedNotification.user.role)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">حالة القراءة من قبل المستخدم</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-1.5">
                                        <span className={`material-symbols-outlined text-[20px] ${selectedNotification.isRead ? 'text-success' : 'text-on-surface-variant'}`}>
                                            {selectedNotification.isRead ? 'drafts' : 'mail'}
                                        </span>
                                        {selectedNotification.isRead ? 'تمت القراءة' : 'لم يقرأ بعد'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">تاريخ الإرسال</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                                        {formatDate(selectedNotification.createdAt)}
                                    </p>
                                </div>
                                {selectedNotification.relatedJobId && (
                                    <div>
                                        <label className="font-label-sm text-on-surface-variant">رقم الوظيفة المرتبطة (Job ID)</label>
                                        <p className="font-body-md text-on-surface mt-1 font-mono text-xs flex items-center gap-2 select-all cursor-help" title="انقر لتحديد المعرف الكامل">
                                            <span className="material-symbols-outlined text-[18px] text-tertiary">work</span>
                                            {selectedNotification.relatedJobId}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            <div>
                                <label className="font-label-sm text-on-surface-variant mb-2 block">محتوى التنبيه</label>
                                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 font-body-md text-on-surface leading-relaxed">
                                    {selectedNotification.body || 'بدون نص تفصيلي.'}
                                </div>
                            </div>

                            {selectedNotification.metadata && (
                                <div>
                                    <label className="font-label-sm text-on-surface-variant mb-2 block">بيانات إضافية (Metadata)</label>
                                    <pre className="text-xs font-mono bg-surface-container-low p-3 rounded-lg border border-outline-variant/50 overflow-x-auto text-left" dir="ltr">
                                        {JSON.stringify(JSON.parse(selectedNotification.metadata), null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
