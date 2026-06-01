import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

// 1. Define the TypeScript interfaces based on your Swagger
interface JobUser {
    userId: string;
    name: string;
    surname: string;
    phoneNo: string;
}

interface Job {
    jobId: string;
    title: string;
    description: string;
    address: string;
    city: string;
    status: string; // OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED
    isUrgent: boolean;
    skill: string;
    createdAt: string;
    completedAt: string | null;
    updatedAt: string;
    customer: JobUser;
    technician: JobUser | null;
}

interface JobApplication {
    applicationId: string;
    status: string; // PENDING, ACCEPTED, REJECTED, CANCELLED
    comment: string;
    phoneRevealedAt: string | null;
    createdAt: string;
    technician: {
        userId: string;
        name: string;
        surname: string;
        phoneNo: string;
        skill: string;
        city: string;
    };
}

export const Jobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters and Modals
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [cancelModalJobId, setCancelModalJobId] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    
    // Slide-out Drawer
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Applications in Drawer
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isAppsLoading, setIsAppsLoading] = useState(false);
    const [appsError, setAppsError] = useState<string | null>(null);

    // Fetch Jobs whenever the status filter changes
    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            try {
                const endpoint = statusFilter ? `/admin/jobs?status=${statusFilter}` : '/admin/jobs';
                const response = await api.get(endpoint);
                
                // Spring Boot Pagination Object
                const rawJobs = response.data.content || response.data;
                setJobs(rawJobs);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch jobs:", err);
                setError("فشل في تحميل بيانات الوظائف. يرجى التحقق من اتصال الخادم.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [statusFilter]);

    // Fetch applications for the selected job when it changes/opens
    useEffect(() => {
        if (!selectedJob) {
            return;
        }

        const fetchApplications = async () => {
            setIsAppsLoading(true);
            setAppsError(null);
            try {
                const response = await api.get(`/applications/job/${selectedJob.jobId}`);
                setApplications(response.data);
            } catch (err) {
                console.error("Failed to fetch applications:", err);
                setAppsError("فشل في تحميل طلبات التقديم لهذه الوظيفة.");
            } finally {
                setIsAppsLoading(false);
            }
        };

        fetchApplications();
    }, [selectedJob]);

    // Handle Force Cancelling a Job
    const handleCancelJob = async () => {
        if (!cancelModalJobId) return;
        setIsCancelling(true);
        setError(null);

        try {
            await api.patch(`/admin/jobs/${cancelModalJobId}/cancel`);
            
            // Instantly update the UI to show the job as cancelled
            setJobs(prevJobs => prevJobs.map(job => 
                job.jobId === cancelModalJobId ? { ...job, status: 'CANCELLED' } : job
            ));
            
            // If the drawer is open for this job, update it too
            if (selectedJob && selectedJob.jobId === cancelModalJobId) {
                setSelectedJob({ ...selectedJob, status: 'CANCELLED' });
            }
            
            setCancelModalJobId(null); // Close modal
        } catch (err) {
            const errorObj = err as { response?: { status?: number } };
            if (errorObj.response && errorObj.response.status === 400) {
                setError("لا يمكن إلغاء هذه الوظيفة في حالتها الحالية (قد تكون مكتملة أو ملغاة بالفعل).");
            } else {
                setError("حدث خطأ أثناء محاولة إلغاء الوظيفة.");
            }
            setCancelModalJobId(null);
        } finally {
            setIsCancelling(false);
        }
    };

    // Open the details drawer
    const handleViewJob = (job: Job) => {
        setApplications([]); // Clear applications synchronously before setting selected job
        setSelectedJob(job);
        setIsDrawerOpen(true);
    };

    // Helper functions for UI
    const translateStatus = (status: string) => {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-surface-variant text-on-surface-variant';
            case 'ASSIGNED': return 'bg-tertiary-container text-tertiary';
            case 'IN_PROGRESS': return 'bg-primary-container text-primary';
            case 'COMPLETED': return 'bg-success-container text-success bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-error-container text-error';
            case 'EXPIRED': return 'bg-outline-variant text-on-surface-variant';
            default: return 'bg-surface-variant text-on-surface-variant';
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
    };

    const translateAppStatus = (status: string) => {
        switch (status) {
            case 'PENDING': return 'قيد الانتظار';
            case 'ACCEPTED': return 'مقبول';
            case 'REJECTED': return 'مرفوض';
            case 'CANCELLED': return 'ملغى';
            default: return status;
        }
    };

    const getAppStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDuration = (start: string, end: string | null) => {
        if (!end) return 'غير مكتمل بعد';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        
        if (diffMs < 0) return 'غير صالح';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let durationStr = '';
        if (diffDays > 0) durationStr += `${diffDays} يوم `;
        if (diffHours > 0) durationStr += `${diffHours} ساعة `;
        if (diffMinutes > 0 || durationStr === '') durationStr += `${diffMinutes} دقيقة`;
        
        return durationStr.trim();
    };

    return (
        <AdminLayout title="مسؤول المتجر">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">الإشراف على الوظائف</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">إدارة ومراقبة الوظائف النشطة على المنصة.</p>
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
                    
                    {/* FILTER DROPDOWN */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center border border-outline-variant rounded-lg bg-surface hover:bg-surface-container-low transition-colors overflow-hidden px-2">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-1">filter_list</span>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-6 pr-2 py-1.5 font-label-sm text-label-sm text-on-surface bg-transparent border-none focus:ring-0 cursor-pointer outline-none appearance-none"
                            >
                                <option value="">كل الوظائف</option>
                                <option value="OPEN">مفتوحة</option>
                                <option value="ASSIGNED">معينة</option>
                                <option value="IN_PROGRESS">قيد التنفيذ</option>
                                <option value="COMPLETED">مكتملة</option>
                                <option value="CANCELLED">ملغاة</option>
                            </select>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">العدد: {jobs.length}</span>
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
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">رقم الوظيفة</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">العميل</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">الفني</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">الحالة</th>
                                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {jobs.map((job) => (
                                <tr key={job.jobId} className="border-b border-outline-variant hover:bg-primary-container/5 transition-colors">
                                    <td className="py-4 px-6 font-medium text-sm">
                                        {/* Show short ID, hover for full ID */}
                                        <span title={job.jobId} className="cursor-help">...{job.jobId.slice(-6).toUpperCase()}</span>
                                        {job.isUrgent && <span className="mr-2 text-error text-xs font-bold bg-error-container px-2 py-0.5 rounded">عاجل</span>}
                                    </td>
                                    <td className="py-4 px-6 font-body-md">
                                        {job.customer.name} {job.customer.surname}
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-on-surface-variant">
                                        {job.technician ? `${job.technician.name} ${job.technician.surname}` : 'غير معين'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-label-sm text-xs ${getStatusColor(job.status)}`}>
                                            {translateStatus(job.status)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-left flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleViewJob(job)}
                                            className="text-primary hover:bg-primary-container/50 p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                        >
                                            تفاصيل
                                        </button>
                                        
                                        {/* Only show cancel button if the job is actually cancellable */}
                                        {(job.status === 'OPEN' || job.status === 'ASSIGNED') && (
                                            <button 
                                                onClick={() => setCancelModalJobId(job.jobId)} 
                                                className="text-error hover:bg-error-container p-2 rounded-lg font-label-md cursor-pointer transition-colors"
                                            >
                                                إلغاء إجباري
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {jobs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد وظائف متاحة بهذا التصنيف.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION CANCEL MODAL */}
            {cancelModalJobId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant p-6 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <span className="material-symbols-outlined text-[32px]">warning</span>
                            <h3 className="font-h3 text-h3 text-on-surface">تأكيد الإلغاء</h3>
                        </div>
                        <p className="mb-6 font-body-md text-on-surface-variant">هل أنت متأكد من إلغاء هذه الوظيفة بالقوة؟ لا يمكن التراجع عن هذا الإجراء وسيتم إشعار العميل.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setCancelModalJobId(null)} disabled={isCancelling} className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-variant disabled:opacity-50">تراجع</button>
                            <button onClick={handleCancelJob} disabled={isCancelling} className="px-4 py-2 bg-error text-on-error rounded-lg cursor-pointer hover:bg-on-error-container flex items-center gap-2 disabled:opacity-50">
                                {isCancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* JOB DETAILS SLIDE-OUT DRAWER */}
            {isDrawerOpen && selectedJob && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    
                    {/* Drawer sliding in from the left */}
                    <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                        
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">تفاصيل الوظيفة</h3>
                            <button onClick={() => setIsDrawerOpen(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            
                            {/* Status and Title */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(selectedJob.status)}`}>
                                        {translateStatus(selectedJob.status)}
                                    </span>
                                    {selectedJob.isUrgent && <span className="bg-error-container text-error px-2.5 py-1 rounded-md text-xs font-bold">عاجل</span>}
                                </div>
                                <h2 className="font-h2 text-on-surface leading-tight">{selectedJob.title}</h2>
                                <p className="font-body-sm text-on-surface-variant mt-1 font-mono text-xs">ID: {selectedJob.jobId}</p>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            {/* Job Info Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">تاريخ الإنشاء (البدء)</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                                        {formatDate(selectedJob.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">تاريخ الانتهاء</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-success">event_available</span>
                                        {selectedJob.completedAt ? formatDate(selectedJob.completedAt) : '---'}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">المدة المستغرقة</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-tertiary">timer</span>
                                        {getDuration(selectedJob.createdAt, selectedJob.completedAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">الموقع</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                        {selectedJob.city} - {selectedJob.address}
                                    </p>
                                </div>
                                <div>
                                    <label className="font-label-sm text-on-surface-variant">المهارة المطلوبة</label>
                                    <p className="font-body-md text-on-surface mt-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">build</span>
                                        {selectedJob.skill}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            {/* Description Box */}
                            <div>
                                <label className="font-label-sm text-on-surface-variant mb-2 block">الوصف</label>
                                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/50 font-body-md text-on-surface">
                                    {selectedJob.description}
                                </div>
                            </div>

                            {/* User Cards */}
                            <div className="space-y-4">
                                {/* Customer Info */}
                                <div className="border border-outline-variant rounded-lg p-4 bg-surface flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold">
                                        {selectedJob.customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-label-sm text-on-surface-variant">العميل (الناشر)</h4>
                                        <p className="font-body-md font-bold text-on-surface">{selectedJob.customer.name} {selectedJob.customer.surname}</p>
                                        <p className="font-body-sm text-on-surface-variant" dir="ltr">{selectedJob.customer.phoneNo}</p>
                                    </div>
                                </div>

                                {/* Technician Info */}
                                {selectedJob.technician ? (
                                    <div className="border border-outline-variant rounded-lg p-4 bg-surface flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-tertiary-container text-tertiary flex items-center justify-center font-bold">
                                            {selectedJob.technician.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-label-sm text-on-surface-variant">الفني (المعين)</h4>
                                            <p className="font-body-md font-bold text-on-surface">{selectedJob.technician.name} {selectedJob.technician.surname}</p>
                                            <p className="font-body-sm text-on-surface-variant" dir="ltr">{selectedJob.technician.phoneNo}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-outline-variant border-dashed rounded-lg p-4 flex items-center justify-center gap-2 text-on-surface-variant">
                                        <span className="material-symbols-outlined">person_search</span>
                                        <span className="font-body-sm">لم يتم تعيين فني بعد</span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full h-px bg-outline-variant/50"></div>

                            {/* Job Applications Section */}
                            <div>
                                <h4 className="font-h3 text-h3 text-on-surface mb-4">طلبات التقديم للوظيفة</h4>
                                
                                {isAppsLoading ? (
                                    <div className="flex items-center justify-center py-6 text-primary">
                                        <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                                        <span className="font-body-sm">جاري تحميل طلبات التقديم...</span>
                                    </div>
                                ) : appsError ? (
                                    <div className="p-4 bg-error-container text-error rounded-lg font-body-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined">error</span>
                                        {appsError}
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="border border-dashed border-outline-variant rounded-lg p-6 text-center text-on-surface-variant font-body-sm">
                                        لا توجد طلبات تقديم لهذه الوظيفة حالياً.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {applications.map((app) => (
                                            <div key={app.applicationId} className="border border-outline-variant rounded-lg p-4 bg-surface hover:bg-surface-container-low transition-colors space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-sm">
                                                            {app.technician ? app.technician.name.charAt(0) : '?'}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-body-md font-bold text-on-surface">
                                                                {app.technician ? `${app.technician.name} ${app.technician.surname}` : 'فني غير معروف'}
                                                            </h5>
                                                            <p className="font-body-sm text-on-surface-variant mt-0.5">
                                                                {app.technician?.skill || 'فني'} • {app.technician?.city || 'دمشق'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAppStatusColor(app.status)}`}>
                                                        {translateAppStatus(app.status)}
                                                    </span>
                                                </div>

                                                {app.comment && (
                                                    <div className="text-body-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded border border-outline-variant/30 italic">
                                                        "{app.comment}"
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center justify-between text-body-sm text-on-surface-variant pt-1 border-t border-outline-variant/20">
                                                    <span className="flex items-center gap-1 font-mono text-xs" dir="ltr">
                                                        <span className="material-symbols-outlined text-[16px]">phone</span>
                                                        {app.technician?.phoneNo || '********'}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-mono text-xs">
                                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                        {formatDate(app.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};