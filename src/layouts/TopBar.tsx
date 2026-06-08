import { useNavigate } from 'react-router-dom';

interface TopBarProps {
    title: string;
}

export const TopBar = ({ title }: TopBarProps) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Here we clear the token we discussed in Step 3!
        localStorage.removeItem('fsm_admin_token');
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-64 h-16 z-30 border-b border-slate-200 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md font-inter text-sm flex items-center justify-between px-8">
            <div className="flex items-center gap-6 w-full justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{title}</span>
                    
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-all active:opacity-70">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    <button onClick={handleLogout} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium cursor-pointer transition-all active:opacity-70 mr-2">
                        تسجيل الخروج
                    </button>
                    <img alt="Admin Profile Avatar" className="h-8 w-8 rounded-full border border-slate-200 mr-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7W41P69jVkiIX_Jp_hoJWQIYYWIPp0wLz5eBzg-t-X7kbTscnkUljszqP-WIn8OdDPMu3HLyyrJayj6O-mvvt1QcExSKUaHuujvcu_pVFfJSKN-aEpXo-6xP7SIww76aeiHpbY6RAyuO4fCaBdeur20uj69lfBA5m9JmX7YX7MwOurm3CMqwD_Yinv7OTwwOo1bUAjio5dxQd6zmdUW5sU3rQqZ8QNwWtV6KfibsvRxD4bKpw-uOouRB97c-R_s7dCCOjGdmFrvYf" />
                </div>
            </div>
        </header>
    );
};