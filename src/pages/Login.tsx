import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

export const Login = () => {
    const navigate = useNavigate();
    
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const cleanPhone = phone.trim();
        const syrianPhoneRegex = /^09\d{8}$/;
        
        if (!syrianPhoneRegex.test(cleanPhone)) {
            setError('يرجى إدخال رقم هاتف سوري صحيح (مثال: 0912345678)');
            return; 
        }

        setIsLoading(true);
        
        try {
            // 1. Get the Token
            const response = await api.post('/auth/login', { 
                phoneNo: cleanPhone, 
                password: password 
            });
            
            const realJwtToken = response.data.token || response.data.accessToken; 
            
            if (!realJwtToken) {
                throw new Error("لم يتم العثور على رمز المصادقة في الاستجابة.");
            }
            
            // 2. Temporarily save the token so our Axios interceptor can use it for the next request
            localStorage.setItem('fsm_admin_token', realJwtToken);
            
            // 3. THE CHECKPOINT: Fetch the user's profile to check their role
            try {
                const meResponse = await api.get('/users/me');
                const userProfile = meResponse.data;

                // 4. If they are not an ADMIN, block them!
                if (userProfile.role !== 'ADMIN') {
                    // Destroy the token
                    localStorage.removeItem('fsm_admin_token');
                    setError('عذراً، هذا النظام مخصص لمسؤولي النظام فقط.');
                    setIsLoading(false);
                    return; // Stop the login process
                }

                // (Optional) Save their name so we can display it in the TopBar later!
                localStorage.setItem('fsm_admin_name', `${userProfile.name} ${userProfile.surname}`);

            } catch (profileErr) {
                // If the /users/me request fails for any reason, abort login to be safe.
                localStorage.removeItem('fsm_admin_token');
                setError('حدث خطأ أثناء التحقق من صلاحيات الحساب.');
                setIsLoading(false);
                return;
            }

            // 5. If they passed the checkpoint, let them into the dashboard!
            navigate('/dashboard');
            
        } catch (err: any) {
            console.error("Login failed", err);
            if (err.response && err.response.status === 401) {
                setError('رقم الهاتف أو كلمة المرور غير صحيحة.');
            } else {
                setError('حدث خطأ أثناء الاتصال بالخادم. يرجى التأكد من تشغيل الخادم.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-surface-container-low min-h-screen flex items-center justify-center p-4 w-full" dir="rtl">
            <main className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden flex flex-col relative z-10">
                <div className="px-8 pt-10 pb-6 text-center border-b border-surface-variant/50">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>dashboard</span>
                    </div>
                    <h1 className="font-h2 text-h2 text-on-surface mb-1">المقر الرئيسي للخدمة الميدانية</h1>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">مركز التحكم</p>
                </div>
                <div className="p-8">
                    
                    {error && (
                        <div className="mb-5 p-3 bg-error-container text-error rounded-lg font-body-md text-sm text-center border border-error/20">
                            {error}
                        </div>
                    )}
                    
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1.5">رقم الهاتف</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-outline text-opacity-70 text-[20px]">call</span>
                                </div>
                                <input 
                                    className="block w-full pr-10 pl-3 py-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface transition-colors text-right placeholder:text-right" 
                                    dir="ltr" 
                                    type="tel" 
                                    placeholder="09XXXXXXXX"
                                    required 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-label-md text-label-md text-on-surface mb-1.5">كلمة المرور</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-outline text-opacity-70 text-[20px]">lock</span>
                                </div>
                                <input 
                                    className="block w-full pr-10 pl-3 py-2.5 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface transition-colors" 
                                    dir="ltr" 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm font-label-md text-label-md text-on-primary bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer disabled:opacity-70"
                            >
                                {isLoading ? 'جاري التحقق من الصلاحيات...' : 'تسجيل الدخول'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};