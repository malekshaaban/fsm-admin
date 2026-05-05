import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    return (
        <div className="flex bg-background min-h-screen text-on-surface">
            <Sidebar />
            <div className="flex-1 mr-64 flex flex-col min-h-screen">
                <TopBar title={title} />
                <main className="flex-1 mt-16 p-8 max-w-[1440px] mx-auto w-full">
                    {/* This is where the specific page content gets injected */}
                    {children}
                </main>
            </div>
        </div>
    );
};