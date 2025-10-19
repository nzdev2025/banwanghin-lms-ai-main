import React from 'react';
import Icon from '../../icons/Icon';

const Header = ({ user, handleLogout }) => {
  const displayName = React.useMemo(() => {
    if (!user) return 'ผู้ใช้';
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'ผู้ใช้';
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#12162b]/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-5 lg:px-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-wider text-slate-400">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold text-white">
              สวัสดี, {displayName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
              title="แจ้งเตือน"
            >
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-400" />
              <Icon name="Bell" size={20} className="text-slate-200" />
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg font-semibold uppercase text-white">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-medium text-white">{displayName}</span>
                <span className="max-w-[140px] truncate text-xs text-slate-400">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-200 transition hover:bg-rose-500/30"
                title="ออกจากระบบ"
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
