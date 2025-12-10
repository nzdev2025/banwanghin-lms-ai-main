import React from 'react';
import Icon from '../../icons/Icon';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { user, handleLogout, toggleSidebar } = useApp();
  const displayName = React.useMemo(() => {
    if (!user) return 'ผู้ใช้';
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'ผู้ใช้';
  }, [user]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl">
      <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-b-3xl border-b border-white/10 bg-gradient-to-r from-[#0b1022]/90 via-[#0f1a33]/88 to-[#091020]/90 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] lg:px-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="pointer-events-none absolute right-10 -top-16 h-52 w-52 rounded-full bg-purple-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-32 w-32 rounded-full bg-rose-400/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 border border-white/5 rounded-b-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="toggle sidebar"
            >
              <Icon name="Menu" size={24} />
            </button>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-200 shadow-inner shadow-black/25 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Welcome back
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                สวัสดี, {displayName} 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-white/5 text-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(0,0,0,0.4)] hover:border-white/25"
              title="แจ้งเตือน"
              aria-label="notifications"
            >
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-400" />
              <Icon name="Bell" size={20} />
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-inner shadow-black/30 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg font-semibold uppercase text-white ring-4 ring-white/10 shadow-lg shadow-black/40">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold text-white drop-shadow">{displayName}</span>
                <span className="max-w-[160px] truncate text-xs text-slate-200/80">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/50 bg-gradient-to-br from-rose-500/30 to-amber-400/20 text-rose-50 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(244,114,182,0.35)]"
                title="ออกจากระบบ"
                aria-label="logout"
              >
                <Icon name="LogOut" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
