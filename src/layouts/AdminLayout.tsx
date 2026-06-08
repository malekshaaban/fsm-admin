import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen text-on-surface">
            {/* Sidebar backdrop overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 md:mr-64 flex flex-col min-h-screen w-full transition-all duration-300">
                <TopBar title={title} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 mt-16 p-4 md:p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
                    {/* This is where the specific page content gets injected */}
                    {children}
                </main>
            </div>
        </div>
    );
};