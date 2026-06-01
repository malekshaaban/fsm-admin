import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

interface SystemConfig {
    configKey: string;
    configValue: string;
    description: string;
    updatedAt: string;
}

export const Settings = () => {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit modal state
    const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
    const [newValue, setNewValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchConfigs = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/config');
            setConfigs(response.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch system configs:", err);
            setError("فشل في تحميل إعدادات النظام. يرجى التحقق من اتصال الخادم.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const translateConfigKey = (key: string) => {
        switch (key) {
            case 'JOB_EXPIRY_HOURS': return 'ساعات صلاحية الوظيفة';
            case 'MAX_APPLICATIONS_PER_JOB': return 'الحد الأقصى للتقديم على الوظيفة';
            default: return key;
        }
    };

    const translateConfigDescription = (key: string) => {
        switch (key) {
            case 'JOB_EXPIRY_HOURS': 
                return 'عدد الساعات المسموح بها للوظيفة المفتوحة للبقاء نشطة قبل أن تنتهي صلاحيتها تلقائياً وتغلق.';
            case 'MAX_APPLICATIONS_PER_JOB': 
                return 'الحد الأقصى لطلبات التقديم التي يمكن للفنيين تقديمها على وظيفة واحدة قبل إيقاف استقبال الطلبات.';
            default: return '';
        }
    };

    const formatConfigUnit = (key: string, value: string) => {
        switch (key) {
            case 'JOB_EXPIRY_HOURS': return `${value} ساعة`;
            case 'MAX_APPLICATIONS_PER_JOB': return `${value} طلب تقديم`;
            default: return value;
        }
    };

    const getConfigIcon = (key: string) => {
        switch (key) {
            case 'JOB_EXPIRY_HOURS': return 'hourglass_empty';
            case 'MAX_APPLICATIONS_PER_JOB': return 'group_add';
            default: return 'settings';
        }
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('ar-SY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const openEditModal = (config: SystemConfig) => {
        setEditingConfig(config);
        setNewValue(config.configValue);
        setModalError(null);
    };

    const closeEditModal = () => {
        setEditingConfig(null);
        setNewValue('');
        setModalError(null);
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConfig) return;

        // Validation
        const valNum = Number(newValue.trim());
        if (isNaN(valNum) || valNum <= 0 || !Number.isInteger(valNum)) {
            setModalError("يرجى إدخال قيمة عددية صحيحة أكبر من الصفر.");
            return;
        }

        setIsUpdating(true);
        setModalError(null);

        try {
            await api.patch(`/admin/config/${editingConfig.configKey}`, { value: newValue.trim() });
            
            // Instantly update UI
            setConfigs(prev => prev.map(c => 
                c.configKey === editingConfig.configKey 
                    ? { ...c, configValue: newValue.trim(), updatedAt: new Date().toISOString() } 
                    : c
            ));
            
            closeEditModal();
        } catch (err) {
            console.error("Failed to update system config:", err);
            setModalError("حدث خطأ أثناء محاولة تحديث القيمة.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <AdminLayout title="إعدادات النظام">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">إعدادات النظام</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">تعديل متغيرات النظام وقواعد السوق المشتركة للمنصة.</p>
                </div>
                <button 
                    onClick={fetchConfigs} 
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
                >
                    <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                    تحديث الإعدادات
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
                    <span className="material-symbols-outlined animate-spin text-primary text-5xl mb-4">autorenew</span>
                    <p className="text-on-surface-variant font-body-lg">جاري تحميل إعدادات النظام...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {configs.map((config) => (
                        <div 
                            key={config.configKey} 
                            className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[24px]">
                                            {getConfigIcon(config.configKey)}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => openEditModal(config)}
                                        className="text-primary hover:bg-primary-container/30 px-3 py-1.5 rounded-lg border border-outline-variant font-label-md transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        تعديل القيمة
                                    </button>
                                </div>
                                <h3 className="font-h3 text-h3 text-on-surface mb-2">
                                    {translateConfigKey(config.configKey)}
                                </h3>
                                <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">
                                    {translateConfigDescription(config.configKey) || config.description}
                                </p>
                            </div>

                            <div className="border-t border-outline-variant/50 pt-4 flex flex-col gap-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-on-surface-variant font-label-sm">القيمة الحالية:</span>
                                    <span className="font-h2 text-h2 text-primary font-bold">
                                        {formatConfigUnit(config.configKey, config.configValue)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-on-surface-variant" dir="rtl">
                                    <span>آخر تحديث:</span>
                                    <span className="font-mono">{formatDate(config.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {configs.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-on-surface-variant font-body-md">
                            لا توجد إعدادات متوفرة في النظام حالياً.
                        </div>
                    )}
                </div>
            )}

            {/* EDIT CONFIG VALUE MODAL */}
            {editingConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">تعديل قيمة الإعداد</h3>
                            <button onClick={closeEditModal} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateConfig} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-error-container text-error rounded-lg font-body-md text-sm border border-error/20 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {modalError}
                                </div>
                            )}
                            <div>
                                <label className="block font-label-sm text-on-surface-variant mb-1">اسم المتغير</label>
                                <span className="block font-label-md text-on-surface font-bold mb-4">
                                    {translateConfigKey(editingConfig.configKey)}
                                </span>
                                
                                <label className="block font-label-sm text-on-surface mb-1.5">القيمة الجديدة *</label>
                                <input 
                                    required 
                                    type="text" 
                                    dir="ltr"
                                    value={newValue} 
                                    onChange={e => setNewValue(e.target.value)} 
                                    className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-right font-bold text-lg font-mono"
                                />
                                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                    {translateConfigDescription(editingConfig.configKey)}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={closeEditModal} 
                                    disabled={isUpdating} 
                                    className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isUpdating} 
                                    className="px-5 py-2 bg-primary text-on-primary rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
