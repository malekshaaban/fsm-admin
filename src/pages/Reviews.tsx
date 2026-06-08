import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

// 1. Define the TypeScript shape based on your Swagger documentation
interface ReviewUser {
    userId: string;
    name: string;
    surname: string;
}

interface ReviewJob {
    jobId: string;
    title: string;
}

interface Review {
    reviewId: string;
    rating: number;
    comment: string;
    createdAt: string;
    job: ReviewJob;
    customer: ReviewUser;
    technician: ReviewUser;
}

export const Reviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Deletion Modal State
    const [deleteModalReviewId, setDeleteModalReviewId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Review Detail Drawer State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    // Fetch Reviews on mount
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                let endpoint = `/admin/reviews?page=${page}&size=10`;
                if (debouncedSearch) {
                    endpoint += `&search=${encodeURIComponent(debouncedSearch)}`;
                }
                const response = await api.get(endpoint);
                // Extract the array from the Spring Boot Page object
                const rawReviews = response.data.content || response.data;
                const data = response.data;
                if (data.page && data.page.totalPages !== undefined) {
                    setTotalPages(data.page.totalPages);
                    setTotalElements(data.page.totalElements);
                } else if (data.totalPages !== undefined) {
                    setTotalPages(data.totalPages);
                    setTotalElements(data.totalElements);
                } else {
                    setTotalPages(1);
                    setTotalElements(Array.isArray(rawReviews) ? rawReviews.length : 0);
                }
                setReviews(rawReviews);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                setError("فشل في تحميل بيانات التقييمات. يرجى التحقق من اتصال الخادم.");
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [debouncedSearch, page]);

    // Handle Permanent Deletion
    const handleDeleteReview = async () => {
        if (!deleteModalReviewId) return;
        setIsDeleting(true);
        setError(null);

        try {
            // Send the DELETE request to Spring Boot
            await api.delete(`/admin/reviews/${deleteModalReviewId}`);
            
            // Instantly remove the deleted review from the React UI
            setReviews(prevReviews => prevReviews.filter(review => review.reviewId !== deleteModalReviewId));
            
            setDeleteModalReviewId(null); // Close the modal
        } catch (err: any) {
            console.error("Failed to delete review:", err);
            if (err.response && err.response.status === 404) {
                setError("التقييم غير موجود أو تم حذفه مسبقاً.");
            } else {
                setError("حدث خطأ أثناء محاولة حذف التقييم.");
            }
            setDeleteModalReviewId(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper function to dynamically render the correct number of yellow stars
    const renderStars = (rating: number) => {
        return (
            <div className="flex text-tertiary">
                {[1, 2, 3, 4, 5].map((starIndex) => (
                    <span 
                        key={starIndex}
                        className={`material-symbols-outlined text-[18px] ${starIndex > rating ? 'text-outline-variant' : ''}`}
                        style={starIndex <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                        star
                    </span>
                ))}
            </div>
        );
    };

    return (
        <AdminLayout title="إدارة التقييمات">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">أحدث التقييمات</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">مراقبة وإدارة تعليقات العملاء عبر جميع مهام الخدمة المكتملة.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center border border-outline-variant rounded-lg bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all w-full sm:w-72">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant mr-1">search</span>
                        <input
                            type="text"
                            placeholder="بحث باسم العميل أو الفني..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-on-surface mr-2 placeholder:text-on-surface-variant"
                        />
                    </div>
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 h-[42px] bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer shrink-0">
                        <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                        <span className="hidden sm:inline">تحديث</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            {/* Data Table Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden relative min-h-[300px]">
                
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 z-20">
                        <span className="text-primary font-label-md flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            جاري التحميل...
                        </span>
                    </div>
                )}

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant">
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">عنوان الوظيفة</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">العميل</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">الفني</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-28">التقييم</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">التعليق</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-36">التاريخ</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-left w-24">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            
                            {reviews.map((review) => {
                                // Smart UI: Automatically flag bad reviews (1 or 2 stars)
                                const isFlagged = review.rating <= 2;
                                const customerFullName = review.customer ? `${review.customer.name} ${review.customer.surname}` : 'غير معروف';
                                const technicianFullName = review.technician ? `${review.technician.name} ${review.technician.surname}` : 'غير معين';
                                const formattedDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

                                return (
                                    <tr 
                                        key={review.reviewId} 
                                        className={`hover:bg-primary/5 transition-colors group cursor-pointer ${isFlagged ? 'bg-error-container/20' : ''}`}
                                        onClick={() => setSelectedReview(review)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-label-md text-on-surface" title={review.job?.title || ''}>
                                                {review.job?.title || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                                                <span className="font-body-md text-on-surface">{customerFullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-primary">engineering</span>
                                                <span className="font-body-md text-on-surface">{technicianFullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {renderStars(review.rating)}
                                                <span className="font-label-sm text-on-surface-variant">({review.rating})</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 font-body-md text-body-md max-w-xs truncate ${isFlagged ? 'font-semibold text-on-error-container' : 'text-on-surface-variant'}`}>
                                            {review.comment ? `"${review.comment}"` : <span className="italic text-on-surface-variant/60">بدون تعليق</span>}
                                        </td>
                                        <td className="px-6 py-4 font-body-sm text-on-surface-variant whitespace-nowrap">
                                            {formattedDate}
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedReview(review); }}
                                                    className="inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                                                    title="عرض التفاصيل"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteModalReviewId(review.reviewId); }}
                                                    className="inline-flex items-center justify-center w-8 h-8 text-error hover:bg-error/10 rounded-md transition-colors cursor-pointer"
                                                    title="حذف"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {reviews.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد تقييمات حالياً.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <div className="font-body-sm text-on-surface-variant">
                        إجمالي العناصر: {totalElements}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 0 || isLoading}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-outline-variant rounded-md disabled:opacity-50 hover:bg-surface-container-low transition-colors text-on-surface flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <span className="font-label-md text-on-surface px-4">
                            صفحة {page + 1} من {totalPages || 1}
                        </span>
                        <button 
                            disabled={page >= totalPages - 1 || isLoading}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-outline-variant rounded-md disabled:opacity-50 hover:bg-surface-container-low transition-colors text-on-surface flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION DELETE MODAL */}
            {deleteModalReviewId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant p-6 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 text-error">
                            <span className="material-symbols-outlined text-[32px]">warning</span>
                            <h3 className="font-h3 text-h3 text-on-surface">تأكيد الحذف</h3>
                        </div>
                        <p className="mb-6 font-body-md text-on-surface-variant">هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setDeleteModalReviewId(null)} 
                                disabled={isDeleting} 
                                className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-variant disabled:opacity-50"
                            >
                                تراجع
                            </button>
                            <button 
                                onClick={handleDeleteReview} 
                                disabled={isDeleting} 
                                className="px-4 py-2 bg-error text-on-error rounded-lg cursor-pointer hover:bg-on-error-container flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW DETAIL SIDE DRAWER */}
            {selectedReview && (() => {
                const drawerCustomerName = selectedReview.customer ? `${selectedReview.customer.name} ${selectedReview.customer.surname}` : 'غير معروف';
                const drawerTechnicianName = selectedReview.technician ? `${selectedReview.technician.name} ${selectedReview.technician.surname}` : 'غير معين';
                const drawerDate = selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                const drawerIsFlagged = selectedReview.rating <= 2;

                return (
                    <div className="fixed inset-0 z-50 flex">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedReview(null)}></div>
                        
                        {/* Drawer sliding in from the left (RTL) */}
                        <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                            
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                                <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">rate_review</span>
                                    تفاصيل التقييم
                                </h3>
                                <button onClick={() => setSelectedReview(null)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                
                                {/* Rating Header */}
                                <div className={`text-center py-6 rounded-xl border ${drawerIsFlagged ? 'bg-error-container/30 border-error/30' : 'bg-primary/5 border-primary/20'}`}>
                                    <div className="flex justify-center mb-2">
                                        {renderStars(selectedReview.rating)}
                                    </div>
                                    <span className={`text-3xl font-bold ${drawerIsFlagged ? 'text-error' : 'text-primary'}`}>
                                        {selectedReview.rating}/5
                                    </span>
                                    {drawerIsFlagged && (
                                        <div className="mt-2 flex items-center justify-center gap-1 text-error font-label-md">
                                            <span className="material-symbols-outlined text-[16px]">flag</span>
                                            تقييم سلبي
                                        </div>
                                    )}
                                </div>

                                {/* Comment Section */}
                                <div>
                                    <label className="font-label-sm text-on-surface-variant flex items-center gap-1 mb-2">
                                        <span className="material-symbols-outlined text-[16px]">chat</span>
                                        نص التعليق
                                    </label>
                                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                                        <p className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                                            {selectedReview.comment || <span className="italic text-on-surface-variant/60">لم يترك العميل أي تعليق.</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Job Info */}
                                <div>
                                    <label className="font-label-sm text-on-surface-variant flex items-center gap-1 mb-2">
                                        <span className="material-symbols-outlined text-[16px]">work</span>
                                        الوظيفة
                                    </label>
                                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                                        <p className="font-label-md text-on-surface">{selectedReview.job?.title || '—'}</p>
                                    </div>
                                </div>

                                {/* People Section */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Customer */}
                                    <div>
                                        <label className="font-label-sm text-on-surface-variant flex items-center gap-1 mb-2">
                                            <span className="material-symbols-outlined text-[16px]">person</span>
                                            العميل
                                        </label>
                                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-label-md text-primary">
                                                {selectedReview.customer?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-body-md text-on-surface">{drawerCustomerName}</span>
                                        </div>
                                    </div>
                                    {/* Technician */}
                                    <div>
                                        <label className="font-label-sm text-on-surface-variant flex items-center gap-1 mb-2">
                                            <span className="material-symbols-outlined text-[16px]">engineering</span>
                                            الفني
                                        </label>
                                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-label-md text-primary">
                                                {selectedReview.technician?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-body-md text-on-surface">{drawerTechnicianName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="font-label-sm text-on-surface-variant flex items-center gap-1 mb-2">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                        تاريخ التقييم
                                    </label>
                                    <p className="font-body-md text-on-surface">{drawerDate}</p>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end">
                                <button 
                                    onClick={() => { setDeleteModalReviewId(selectedReview.reviewId); setSelectedReview(null); }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-error text-on-error hover:bg-on-error-container rounded-lg font-label-md text-label-md transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    حذف التقييم
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AdminLayout>
    );
};