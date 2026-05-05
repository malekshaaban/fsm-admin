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

    // Deletion Modal State
    const [deleteModalReviewId, setDeleteModalReviewId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Reviews on mount
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await api.get('/admin/reviews');
                // Extract the array from the Spring Boot Page object
                const rawReviews = response.data.content || response.data;
                setReviews(rawReviews);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                setError("فشل في تحميل بيانات التقييمات. يرجى التحقق من اتصال الخادم.");
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, []);

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
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">أحدث التقييمات</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">مراقبة وإدارة تعليقات العملاء عبر جميع مهام الخدمة المكتملة.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer">
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
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-32">معرف التقييم</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-48">تفاصيل الوظيفة</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-32">التقييم</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">نص التعليق</th>
                                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-left w-32">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            
                            {reviews.map((review) => {
                                // Smart UI: Automatically flag bad reviews (1 or 2 stars)
                                const isFlagged = review.rating <= 2;

                                return (
                                    <tr 
                                        key={review.reviewId} 
                                        className={`hover:bg-primary/5 transition-colors group ${isFlagged ? 'bg-error-container/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface font-medium text-xs">
                                            <span title={review.reviewId} className="cursor-help">...{review.reviewId.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-label-md text-primary hover:underline cursor-pointer" title={review.job.title}>
                                                    ...{review.job.jobId.slice(-6).toUpperCase()}
                                                </span>
                                                <span className="font-body-sm text-on-surface-variant mt-0.5">
                                                    بواسطة: {review.customer.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderStars(review.rating)}
                                        </td>
                                        <td className={`px-6 py-4 font-body-md text-body-md max-w-md truncate ${isFlagged ? 'font-semibold text-on-error-container' : 'text-on-surface-variant'}`}>
                                            "{review.comment || 'بدون تعليق'}"
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <button 
                                                onClick={() => setDeleteModalReviewId(review.reviewId)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error text-on-error hover:bg-on-error-container rounded-md font-label-md text-label-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {reviews.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-on-surface-variant font-body-md">
                                        لا توجد تقييمات حالياً.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
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
        </AdminLayout>
    );
};