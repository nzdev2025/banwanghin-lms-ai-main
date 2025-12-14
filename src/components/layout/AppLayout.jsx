import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Icon from '../../icons/Icon';

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Icon name="Loader2" className="animate-spin text-teal-400" size={32} />
  </div>
);

const AppLayout = () => {
  const currentYear = new Date().getFullYear();
  const { siteConfig } = useSiteConfig();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1b1f38] via-[#121629] to-[#0b1020] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-10">
            <div className="flex min-h-full flex-col gap-8">
              <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </div>
              <footer className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-sm text-slate-300 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  © {currentYear} {siteConfig.footerText}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span>เวอร์ชัน {siteConfig.version}</span>
                  <span className="hidden sm:block">•</span>
                  <span>พัฒนาโดย {siteConfig.developerName} ICT Talent Connext ED</span>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
