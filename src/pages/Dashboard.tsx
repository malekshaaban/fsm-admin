import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

// Define the shape of the data based on your Swagger documentation
interface DashboardStats {
    totalUsers: number;
    totalCustomers: number;
    totalTechnicians: number;
    totalAdmins: number;
    totalJobs: number;
    openJobs: number;
    assignedJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    totalReviews: number;
    averageRating: number;
    pendingReportsCount: number;
}

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the Admin's name from LocalStorage (Saved during Login!)
    const adminName = localStorage.getItem('fsm_admin_name') || 'مسؤول النظام';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch from the /admin/stats endpoint
                const response = await api.get('/admin/stats');
                setStats(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError("تعذر تحميل إحصائيات لوحة القيادة. يرجى التحقق من اتصال الخادم.");
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleExport = () => {
        if (!stats) return;

        // 1. Define the CSV rows (Header + Data)
        const csvRows = [
            ['المقياس', 'القيمة'], // Headers: Metric, Value
            ['إجمالي المستخدمين', stats.totalUsers],
            ['إجمالي العملاء', stats.totalCustomers],
            ['إجمالي الفنيين', stats.totalTechnicians],
            ['إجمالي المسؤولين', stats.totalAdmins],
            ['إجمالي الوظائف', stats.totalJobs],
            ['وظائف مفتوحة', stats.openJobs],
            ['وظائف قيد التنفيذ', stats.assignedJobs],
            ['وظائف مكتملة', stats.completedJobs],
            ['وظائف ملغاة', stats.cancelledJobs],
            ['إجمالي التقييمات', stats.totalReviews],
            ['متوسط التقييم', stats.averageRating.toFixed(1)],
            ['بلاغات معلقة', stats.pendingReportsCount]
        ];

        // 2. Convert the array to a CSV string. 
        // \uFEFF ensures Arabic characters render correctly in Excel.
        const csvContent = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n');

        // 3. Create a Blob (a file-like object)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // 4. Create an invisible link, click it to download, and remove it
        const link = document.createElement('a');
        const dateString = new Date().toISOString().split('T')[0]; // Gets YYYY-MM-DD
        
        link.setAttribute('href', url);
        link.setAttribute('download', `إحصائيات_المنصة_${dateString}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout title="لوحة القيادة">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">مرحباً بعودتك، {adminName}</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                        إليك نظرة عامة على نشاط منصة الخدمة الميدانية اليوم.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                        تحديث البيانات
                    </button>
                  <button 
    onClick={handleExport} // <-- Add this!
    disabled={!stats || isLoading} // Prevents exporting before data loads
    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer disabled:opacity-50"
>
    <span className="material-symbols-outlined text-[18px]">download</span>
    تصدير التقرير
</button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            {/* If loading, show a nice skeleton or spinner state. Otherwise, show cards */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-5xl mb-4">autorenew</span>
                    <p className="text-on-surface-variant font-body-lg">جاري تجميع الإحصائيات...</p>
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Users Card */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[24px]">group</span>
                            </div>
                        </div>
                        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">إجمالي المستخدمين</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="font-h1 text-4xl font-bold text-on-surface">{stats.totalUsers}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">عملاء:</span>
                                <span className="font-semibold text-on-surface">{stats.totalCustomers}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">فنيين:</span>
                                <span className="font-semibold text-on-surface">{stats.totalTechnicians}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">مسؤولين:</span>
                                <span className="font-semibold text-on-surface">{stats.totalAdmins}</span>
                            </div>
                        </div>
                    </div>

                    {/* Jobs Card */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary">
                                <span className="material-symbols-outlined text-[24px]">work</span>
                            </div>
                        </div>
                        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">إجمالي الوظائف</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="font-h1 text-4xl font-bold text-on-surface">{stats.totalJobs}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">مفتوحة:</span>
                                <span className="font-semibold text-primary">{stats.openJobs}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">معينة/قيد التنفيذ:</span>
                                <span className="font-semibold text-tertiary">{stats.assignedJobs}</span>
                            </div>
                        </div>
                    </div>

                    {/* Completed & Cancelled Jobs */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-success-container text-success flex items-center justify-center bg-green-100 text-green-700">
                                <span className="material-symbols-outlined text-[24px]">task_alt</span>
                            </div>
                        </div>
                        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">الوظائف المكتملة</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="font-h1 text-4xl font-bold text-on-surface">{stats.completedJobs}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-error">ملغاة:</span>
                                <span className="font-semibold text-error">{stats.cancelledJobs}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Card */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                        </div>
                        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">التقييمات والمراجعات</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="font-h1 text-4xl font-bold text-on-surface">{stats.totalReviews}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-on-surface-variant">متوسط التقييم:</span>
                                <span className="font-semibold text-on-surface flex items-center gap-1">
                                    {stats.averageRating.toFixed(1)}
                                    <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pending Reports Card */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-[24px]">flag</span>
                            </div>
                        </div>
                        <h3 className="font-body-md text-body-md text-on-surface-variant mb-1">بلاغات معلقة</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="font-h1 text-4xl font-bold text-on-surface">{stats.pendingReportsCount}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/50 pt-3">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-on-surface-variant">بانتظار المراجعة</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

        </AdminLayout>
    );
};