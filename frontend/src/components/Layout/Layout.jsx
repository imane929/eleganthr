import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
                setMobileMenuOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Navbar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen}
                isMobile={isMobile}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            <div className="flex">
                <Sidebar 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen}
                    isMobile={isMobile}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-64' : !isMobile ? 'ml-20' : ''} mt-16`}>
                    <div className="p-4 sm:p-6 lg:p-8">
                        <Suspense fallback={<LoadingFallback />}>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
            
            {isMobile && mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
