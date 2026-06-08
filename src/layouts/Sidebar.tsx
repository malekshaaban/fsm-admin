import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    // A helper function to check if the current URL matches the link's path
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className={`fixed right-0 top-0 h-screen w-64 z-40 border-l border-slate-800 shadow-2xl bg-slate-950 font-inter text-sm font-medium flex flex-col justify-between py-6 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div>
                <div className="flex justify-between items-center px-6 mb-8">
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">مقر الخدمة الميدانية</h1>
                        <p className="text-slate-400 font-body-sm text-body-sm mt-1">مركز التحكم</p>
                    </div>
                    {/* Close Button for Mobile Screens */}
                    <button 
                        onClick={onClose}
                        className="md:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
                <ul className="space-y-1">
                    <li>
                        <Link onClick={onClose} to="/dashboard" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/dashboard') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : "" }}>dashboard</span>
                            لوحة القيادة
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/users" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/users') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/users') ? "'FILL' 1" : "" }}>group</span>
                            إدارة المستخدمين
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/jobs" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/jobs') || isActive('/orders') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/jobs') || isActive('/orders') ? "'FILL' 1" : "" }}>work</span>
                            الإشراف على الوظائف
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/reviews" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/reviews') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/reviews') ? "'FILL' 1" : "" }}>rate_review</span>
                            الإشراف على المراجعات
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/reports" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/reports') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/reports') ? "'FILL' 1" : "" }}>flag</span>
                            البلاغات
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/logs" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/logs') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/logs') ? "'FILL' 1" : "" }}>history</span>
                            سجل العمليات
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/notifications" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/notifications') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/notifications') ? "'FILL' 1" : "" }}>notifications</span>
                            سجل الإشعارات
                        </Link>
                    </li>
                    <li>
                        <Link onClick={onClose} to="/settings" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/settings') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/settings') ? "'FILL' 1" : "" }}>settings</span>
                            إعدادات النظام
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="px-4">
                <ul className="space-y-1 border-t border-slate-800 pt-4">
                    <li>
                        <Link to="/" className="flex items-center gap-3 text-slate-400 px-4 py-3 hover:text-slate-100 transition-colors hover:bg-slate-900/50 active:scale-[0.98] duration-150">
                            <span className="material-symbols-outlined">logout</span>
                            تسجيل الخروج
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};