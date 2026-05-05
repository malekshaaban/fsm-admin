import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
    const location = useLocation();
    // A helper function to check if the current URL matches the link's path
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed right-0 top-0 h-screen w-64 z-40 border-l border-slate-800 shadow-2xl bg-slate-950 font-inter text-sm font-medium flex flex-col justify-between py-6">
            <div>
                <div className="px-6 mb-8">
                    <h1 className="text-lg font-bold text-white tracking-tight">مقر الخدمة الميدانية</h1>
                    <p className="text-slate-400 font-body-sm text-body-sm mt-1">مركز التحكم</p>
                </div>
                <ul className="space-y-1">
                    <li>
                        <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/dashboard') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : "" }}>dashboard</span>
                            لوحة القيادة
                        </Link>
                    </li>
                    <li>
                        <Link to="/users" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/users') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/users') ? "'FILL' 1" : "" }}>group</span>
                            إدارة المستخدمين
                        </Link>
                    </li>
                    <li>
                        <Link to="/jobs" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/jobs') || isActive('/orders') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/jobs') || isActive('/orders') ? "'FILL' 1" : "" }}>work</span>
                            الإشراف على الوظائف
                        </Link>
                    </li>
                    <li>
                        <Link to="/reviews" className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] duration-150 ${isActive('/reviews') ? 'border-r-4 border-blue-600 bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/reviews') ? "'FILL' 1" : "" }}>rate_review</span>
                            الإشراف على المراجعات
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