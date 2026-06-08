import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    rawRole: string;
    role: string;
    status: string;
    avatarUrl: string | null;
    initials?: string;
}

// NEW: Interface for the detailed profile from the backend
interface UserProfile {
    userId: string;
    name: string;
    surname: string;
    phoneNo: string;
    role: string;
    accountStatus: string;
    city: string;
    skill: string | null;
    description: string | null;
    profilePhotoUrl: string | null;
    createdAt: string;
}

export const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>(''); 
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [roleFilter, debouncedSearch]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);
    
    const [roleModalUserId, setRoleModalUserId] = useState<string | null>(null);
    const [newSelectedRole, setNewSelectedRole] = useState<string>('CUSTOMER');
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteForm, setInviteForm] = useState({
        name: '', surname: '', phoneNo: '', password: '', role: 'CUSTOMER', city: '', skill: '', description: ''
    });

    // --- NEW: Profile Drawer State ---
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                let endpoint = `/admin/users?page=${page}&size=10&`;
                if (roleFilter) endpoint += `role=${roleFilter}&`;
                if (debouncedSearch) endpoint += `search=${encodeURIComponent(debouncedSearch)}&`;
                
                const response = await api.get(endpoint);
                const rawUsers = response.data.content || response.data; 
                const data = response.data;
                if (data.page && data.page.totalPages !== undefined) {
                    setTotalPages(data.page.totalPages);
                    setTotalElements(data.page.totalElements);
                } else if (data.totalPages !== undefined) {
                    setTotalPages(data.totalPages);
                    setTotalElements(data.totalElements);
                } else {
                    setTotalPages(1);
                    setTotalElements(Array.isArray(rawUsers) ? rawUsers.length : 0);
                }

                const mappedUsers = rawUsers.map((user: any) => {
                    let translatedRole = 'عميل';
                    if (user.role === 'ADMIN') translatedRole = 'مسؤول';
                    if (user.role === 'TECHNICIAN') translatedRole = 'فني';

                    let translatedStatus = 'موقوف';
                    if (user.accountStatus === 'ACTIVE') translatedStatus = 'نشط';
                    if (user.accountStatus === 'BANNED') translatedStatus = 'محظور';

                    return {
                        id: user.userId,
                        name: `${user.name} ${user.surname}`,
                        email: user.city || 'بدون مدينة',
                        phone: user.phoneNo,
                        rawRole: user.role,
                        role: translatedRole,
                        status: translatedStatus,
                        avatarUrl: user.profilePhotoUrl,
                        initials: user.name && user.surname ? `${user.name.charAt(0)}.${user.surname.charAt(0)}` : '?'
                    };
                });
                
                setUsers(mappedUsers); 
                setError(null);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError("فشل في تحميل بيانات المستخدمين.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [roleFilter, debouncedSearch, page]); 

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        setOpenMenuId(null);
        setError(null);
        const isBanned = currentStatus === 'محظور';
        const endpoint = isBanned ? `/admin/users/${userId}/activate` : `/admin/users/${userId}/ban`;

        try {
            await api.patch(endpoint);
            setUsers(prevUsers => prevUsers.map(user => {
                if (user.id === userId) return { ...user, status: isBanned ? 'نشط' : 'محظور' };
                return user;
            }));
            
            // If they are toggling the status while the profile drawer is open, update that too!
            if (profileData && profileData.userId === userId) {
                setProfileData({ ...profileData, accountStatus: isBanned ? 'ACTIVE' : 'BANNED' });
            }
            
        } catch (err: any) {
            if (err.response && err.response.status === 400) {
                setError("لا يمكنك حظر مستخدم يمتلك صلاحيات مسؤول (ADMIN).");
            } else {
                setError("حدث خطأ أثناء محاولة تغيير حالة المستخدم.");
            }
        }
    };

    const openChangeRoleModal = (userId: string, currentRawRole: string) => {
        setOpenMenuId(null);
        setNewSelectedRole(currentRawRole);
        setRoleModalUserId(userId);
    };

    const submitChangeRole = async () => {
        if (!roleModalUserId) return;
        setIsUpdatingRole(true);
        setError(null);

        try {
            await api.patch(`/admin/users/${roleModalUserId}/role`, { newRole: newSelectedRole });
            
            let translatedRole = 'عميل';
            if (newSelectedRole === 'ADMIN') translatedRole = 'مسؤول';
            if (newSelectedRole === 'TECHNICIAN') translatedRole = 'فني';

            setUsers(prevUsers => prevUsers.map(u => 
                u.id === roleModalUserId ? { ...u, role: translatedRole, rawRole: newSelectedRole } : u
            ));
            
            // If the profile drawer is open, update the role there too
            if (profileData && profileData.userId === roleModalUserId) {
                setProfileData({ ...profileData, role: newSelectedRole });
            }

            setRoleModalUserId(null); 
        } catch (err: any) {
            if (err.response && err.response.status === 400) {
                setError("لا يمكنك تجريد آخر مسؤول (ADMIN) من صلاحياته.");
            } else {
                setError("حدث خطأ أثناء محاولة تغيير الدور.");
            }
            setRoleModalUserId(null);
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError(null);
        if (!/^09\d{8}$/.test(inviteForm.phoneNo.trim())) {
            setInviteError('يرجى إدخال رقم هاتف سوري صحيح (مثال: 0912345678)');
            return;
        }
        setIsInviting(true);
        try {
            const response = await api.post('/users/register', inviteForm);
            const newUser = response.data;
            const translatedRole = newUser.role === 'TECHNICIAN' ? 'فني' : 'عميل';
            const translatedStatus = newUser.accountStatus === 'ACTIVE' ? 'نشط' : 'موقوف';
            const mappedNewUser = {
                id: newUser.userId,
                name: `${newUser.name} ${newUser.surname}`,
                email: newUser.city || 'بدون مدينة',
                phone: newUser.phoneNo,
                rawRole: newUser.role,
                role: translatedRole,
                status: translatedStatus,
                avatarUrl: newUser.profilePhotoUrl,
                initials: `${newUser.name.charAt(0)}.${newUser.surname.charAt(0)}`
            };
            setUsers(prev => [mappedNewUser, ...prev]);
            setShowInviteModal(false);
            setInviteForm({ name: '', surname: '', phoneNo: '', password: '', role: 'CUSTOMER', city: '', skill: '', description: '' });
        } catch (err: any) {
            if (err.response && err.response.status === 409) setInviteError("رقم الهاتف مسجل بالفعل في النظام.");
            else setInviteError("حدث خطأ أثناء محاولة إنشاء الحساب.");
        } finally {
            setIsInviting(false);
        }
    };

    // --- NEW: Open Profile Drawer & Fetch Details ---
    const handleViewProfile = async (userId: string) => {
        setOpenMenuId(null); // Close dropdown
        setIsProfileOpen(true); // Open drawer instantly
        setIsProfileLoading(true); // Show spinner
        setProfileError(null);
        setProfileData(null); // Clear old data

        try {
            const response = await api.get(`/admin/users/${userId}`);
            setProfileData(response.data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
            setProfileError("تعذر تحميل تفاصيل الملف الشخصي.");
        } finally {
            setIsProfileLoading(false);
        }
    };

    const toggleMenu = (userId: string) => setOpenMenuId(openMenuId === userId ? null : userId);

    // Helper to format date nicely
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    };

    return (
        <AdminLayout title="إدارة المستخدمين">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="font-h2 text-h2 text-on-surface">إدارة المستخدمين</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">إدارة حسابات المنصة والأدوار وحالات الوصول.</p>
                </div>
                <button onClick={() => setShowInviteModal(true)} className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 rounded-lg hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    دعوة مستخدم
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container text-error rounded-lg font-body-md text-sm border border-error/20 flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center border border-outline-variant rounded-lg bg-surface hover:bg-surface-container-low transition-colors overflow-hidden px-2">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-1">filter_list</span>
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="pl-6 pr-2 py-1.5 font-label-sm text-label-sm text-on-surface bg-transparent border-none focus:ring-0 cursor-pointer outline-none appearance-none">
                                <option value="">كل الأدوار</option>
                                <option value="ADMIN">مسؤولين</option>
                                <option value="TECHNICIAN">فنيين</option>
                                <option value="CUSTOMER">عملاء</option>
                            </select>
                        </div>
                        
                        <div className="relative flex items-center border border-outline-variant rounded-lg bg-surface px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all w-64">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-1">search</span>
                            <input
                                type="text"
                                placeholder="بحث بالاسم أو الرقم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-on-surface mr-2 placeholder:text-on-surface-variant"
                            />
                        </div>
                        
                        <span className="font-body-sm text-body-sm text-on-surface-variant">إجمالي المستخدمين: {totalElements}</span>
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
                                <th className="py-3 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-1/3">المستخدم</th>
                                <th className="py-3 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">رقم الهاتف</th>
                                <th className="py-3 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">الدور</th>
                                <th className="py-3 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">الحالة</th>
                                <th className="py-3 px-6 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {!isLoading && users.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-variant/30 transition-colors group">
                                    <td className="py-4 px-6 min-h-[52px]">
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img alt={user.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={user.avatarUrl} />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-label-md text-label-md text-on-surface-variant">
                                                    {user.initials}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-label-md text-label-md text-on-surface">{user.name}</span>
                                                <span className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">{user.phone}</td>
                                    <td className="py-4 px-6">
                                        <span className="inline-flex items-center gap-1.5 font-body-md text-body-md text-on-surface">
                                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                                {user.rawRole === 'TECHNICIAN' ? 'build' : user.rawRole === 'CUSTOMER' ? 'person' : 'admin_panel_settings'}
                                            </span>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-label-sm text-label-sm ${
                                            user.status === 'نشط' ? 'bg-primary-container text-on-primary-container' : 
                                            user.status === 'محظور' ? 'bg-error-container text-error' : 
                                            'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    
                                    <td className="py-4 px-6 text-left relative">
                                        <button onClick={() => toggleMenu(user.id)} className={`p-1.5 rounded-md transition-colors shadow-sm ring-1 ring-outline-variant cursor-pointer ${openMenuId === user.id ? 'bg-surface-container-high text-on-surface opacity-100' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low opacity-0 group-hover:opacity-100'}`}>
                                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                        </button>
                                        
                                        {openMenuId === user.id && (
                                            <>
                                                <div className="fixed inset-0 z-30 cursor-default" onClick={() => setOpenMenuId(null)}></div>
                                                <div className="absolute left-6 top-12 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-40 py-1 flex flex-col items-start">
                                                    
                                                    {/* Updated: This now calls handleViewProfile */}
                                                    <button onClick={() => handleViewProfile(user.id)} className="w-full text-right px-4 py-2 font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer relative z-50">
                                                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                                                        عرض الملف الشخصي
                                                    </button>

                                                    <button onClick={() => openChangeRoleModal(user.id, user.rawRole)} className="w-full text-right px-4 py-2 font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer relative z-50">
                                                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                                        تغيير الدور
                                                    </button>
                                                    <div className="w-full h-px bg-outline-variant my-1"></div>
                                                    <button onClick={() => handleToggleStatus(user.id, user.status)} className="w-full text-right px-4 py-2 font-body-md text-body-md text-error hover:bg-error-container/50 transition-colors flex items-center gap-2 cursor-pointer relative z-50">
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {user.status === 'محظور' ? 'lock_open' : 'block'}
                                                        </span>
                                                        {user.status === 'محظور' ? 'تنشيط المستخدم' : 'حظر المستخدم'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
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

            {/* MODALS OMITTED FOR BREVITY BUT KEPT IN ACTUAL CODE - Role & Invite Modals are still here */}
            {roleModalUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant p-6">
                        <h3 className="font-h3 text-h3 text-on-surface mb-4">تغيير دور المستخدم</h3>
                        <div className="mb-6">
                            <select value={newSelectedRole} onChange={(e) => setNewSelectedRole(e.target.value)} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary outline-none">
                                <option value="CUSTOMER">عميل (Customer)</option>
                                <option value="TECHNICIAN">فني (Technician)</option>
                                <option value="ADMIN">مسؤول (Admin)</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRoleModalUserId(null)} disabled={isUpdatingRole} className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-50">إلغاء</button>
                            <button onClick={submitChangeRole} disabled={isUpdatingRole} className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                                {isUpdatingRole ? 'جاري التحديث...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-2xl border border-outline-variant overflow-hidden my-8">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">إضافة مستخدم جديد</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            {inviteError && <div className="mb-6 p-3 bg-error-container text-error rounded-lg font-body-md text-sm border border-error/20">{inviteError}</div>}
                            <form onSubmit={handleInviteSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">الاسم الأول *</label>
                                        <input required type="text" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">الكنية *</label>
                                        <input required type="text" value={inviteForm.surname} onChange={e => setInviteForm({...inviteForm, surname: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">رقم الهاتف (09XXXXXXXX) *</label>
                                        <input required type="tel" dir="ltr" placeholder="09" value={inviteForm.phoneNo} onChange={e => setInviteForm({...inviteForm, phoneNo: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-right" />
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">كلمة المرور المؤقتة *</label>
                                        <input required type="password" dir="ltr" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none text-right" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">الدور *</label>
                                        <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none">
                                            <option value="CUSTOMER">عميل (Customer)</option>
                                            <option value="TECHNICIAN">فني (Technician)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-sm text-on-surface mb-1.5">المدينة *</label>
                                        <input required type="text" value={inviteForm.city} onChange={e => setInviteForm({...inviteForm, city: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                </div>
                                {inviteForm.role === 'TECHNICIAN' && (
                                    <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/50 space-y-4">
                                        <h4 className="font-label-md text-primary flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">build</span>تفاصيل الفني</h4>
                                        <div>
                                            <label className="block font-label-sm text-on-surface mb-1.5">المهنة / المهارة (Skill) *</label>
                                            <input required={inviteForm.role === 'TECHNICIAN'} type="text" placeholder="مثال: سباك، كهربائي..." value={inviteForm.skill} onChange={e => setInviteForm({...inviteForm, skill: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none" />
                                        </div>
                                        <div>
                                            <label className="block font-label-sm text-on-surface mb-1.5">وصف قصير (Description)</label>
                                            <textarea rows={2} value={inviteForm.description} onChange={e => setInviteForm({...inviteForm, description: e.target.value})} className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none resize-none"></textarea>
                                        </div>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowInviteModal(false)} disabled={isInviting} className="px-5 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors cursor-pointer disabled:opacity-50">إلغاء</button>
                                    <button type="submit" disabled={isInviting} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">{isInviting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: PROFILE SLIDE-OUT DRAWER */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}></div>
                    
                    {/* Drawer sliding in from the left (since UI is RTL) */}
                    <div className="relative w-full max-w-md h-full bg-surface-container-lowest shadow-2xl flex flex-col animate-slide-in-left border-r border-outline-variant mr-auto">
                        
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="font-h3 text-h3 text-on-surface">الملف الشخصي</h3>
                            <button onClick={() => setIsProfileOpen(false)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {isProfileLoading && (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                                    <span className="text-on-surface-variant font-body-md">جاري تحميل البيانات...</span>
                                </div>
                            )}

                            {profileError && (
                                <div className="p-4 bg-error-container text-error rounded-lg font-body-md flex items-center gap-2">
                                    <span className="material-symbols-outlined">error</span>
                                    {profileError}
                                </div>
                            )}

                            {profileData && !isProfileLoading && (
                                <div className="space-y-6">
                                    {/* Header: Avatar & Name */}
                                    <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
                                        {profileData.profilePhotoUrl ? (
                                            <img src={profileData.profilePhotoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-outline-variant shadow-sm" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center font-h2 text-h2 text-primary">
                                                {profileData.name.charAt(0)}.{profileData.surname.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="font-h2 text-h2 text-on-surface">{profileData.name} {profileData.surname}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                    profileData.role === 'ADMIN' ? 'bg-primary/10 text-primary' :
                                                    profileData.role === 'TECHNICIAN' ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-variant text-on-surface-variant'
                                                }`}>
                                                    {profileData.role === 'ADMIN' ? 'مسؤول' : profileData.role === 'TECHNICIAN' ? 'فني' : 'عميل'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                    profileData.accountStatus === 'ACTIVE' ? 'bg-success-container text-success' : 'bg-error-container text-error'
                                                }`}>
                                                    {profileData.accountStatus === 'ACTIVE' ? 'نشط' : 'محظور'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 gap-y-4">
                                        <div>
                                            <label className="font-label-sm text-on-surface-variant">رقم الهاتف</label>
                                            <p className="font-body-lg text-on-surface flex items-center gap-2 mt-1" dir="ltr">
                                                <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                                                {profileData.phoneNo}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-label-sm text-on-surface-variant">المدينة</label>
                                            <p className="font-body-lg text-on-surface flex items-center gap-2 mt-1">
                                                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                                {profileData.city}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-label-sm text-on-surface-variant">تاريخ الانضمام</label>
                                            <p className="font-body-lg text-on-surface flex items-center gap-2 mt-1">
                                                <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                                                {formatDate(profileData.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Technician Specific Details */}
                                    {profileData.role === 'TECHNICIAN' && (
                                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-4">
                                            <h4 className="font-label-md text-tertiary flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">engineering</span>
                                                معلومات الفني
                                            </h4>
                                            <div>
                                                <label className="font-label-sm text-on-surface-variant">المهارة / التخصص</label>
                                                <p className="font-body-lg text-on-surface mt-1">{profileData.skill || 'غير محدد'}</p>
                                            </div>
                                            <div>
                                                <label className="font-label-sm text-on-surface-variant">الوصف المهني</label>
                                                <p className="font-body-md text-on-surface mt-1 bg-surface-container-lowest p-3 rounded-md border border-outline-variant/50">
                                                    {profileData.description || 'لم يتم إضافة وصف.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};