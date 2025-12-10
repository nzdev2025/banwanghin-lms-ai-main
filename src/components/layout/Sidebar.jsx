import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  House,
  Book,
  Users,
  Calendar,
  FilePlus,
  Briefcase,
  Settings,
  LifeBuoy,
  MessageCircle,
  X,
} from 'lucide-react';

import { useSiteConfig } from '../../context/SiteConfigContext';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { siteConfig } = useSiteConfig();
  const { userRole, isSidebarOpen, closeSidebar } = useApp();
  
  const navItems = [
    { icon: House, name: 'แดชบอร์ด', path: '/' },
    { icon: Book, name: 'รายวิชา', path: '/subjects' },
    { icon: Calendar, name: 'ปฏิทินงาน/สอบ', path: '/calendar', feature: 'calendar' },
    { icon: Users, name: 'นักเรียน', path: '/students' },
    { icon: FilePlus, name: 'AI ช่วยสร้าง', path: '/tools', feature: 'tools' },
    { icon: Briefcase, name: 'เครื่องมือช่วยสอน', path: '/classroom-tools' },
    { icon: Settings, name: 'ตั้งค่า', path: '/settings' },
  ].filter((item) => {
    // 1. Feature Flag Check
    if (item.feature && siteConfig.featureFlags?.[item.feature] === false) {
      return false;
    }

    // 2. Role-Based Access Control (RBAC)
    // Student & Parent: Only Dashboard
    if (userRole === 'student' || userRole === 'parent') {
      return item.path === '/';
    }

    // Teacher: No Settings
    if (userRole === 'teacher' && item.path === '/settings') {
      return false;
    }

    // Admin: See All (Settings is restricted to Admin implicit by Teacher check above, 
    // but effectively Admin sees everything unless feature flag hides it)
    if (item.path === '/settings' && userRole !== 'admin') {
         return false;
    }

    return true;
  });

  const supportItems = [
    { icon: MessageCircle, label: 'Community', href: '#' },
    { icon: LifeBuoy, label: 'Help & Support', href: '#' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        data-testid="sidebar-overlay"
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-[100] w-[280px] flex flex-col 
          bg-gradient-to-b from-[#0a0f1e]/95 via-[#0b1224]/90 to-[#070d1a]/95 
          text-slate-200 backdrop-blur-2xl border-r border-white/10 
          shadow-[8px_0_40px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="pointer-events-none absolute -left-16 top-16 h-32 w-32 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="pointer-events-none absolute right-4 top-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
        <div className="relative px-6 pt-8 pb-10">
          <button 
            onClick={closeSidebar}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-inner shadow-black/40">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${siteConfig.primaryColor} text-xl font-semibold text-[#0f1424] ring-4 ring-white/10 shadow-lg shadow-black/30`}
            >
              {siteConfig.logoText}
            </div>
            <div>
              <p className="text-lg font-bold text-white drop-shadow">{siteConfig.siteTitle}</p>
              <p className="text-xs text-slate-300">{siteConfig.schoolName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="flex h-full flex-col">
            <div className="flex-1 pr-1">
              <p className="px-2 text-[11px] uppercase tracking-[0.32em] text-slate-500">Main Menu</p>
              <ul className="mt-4 space-y-2">
                {navItems.map(({ icon: IconComponent, name, path }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={path === '/'}
                      onClick={() => closeSidebar()}
                      data-testid="sidebar-link"
                      className={({ isActive }) =>
                        [
                          'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden',
                          isActive
                            ? 'text-white shadow-lg shadow-indigo-900/40'
                            : 'text-slate-300 hover:text-white hover:bg-white/5',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-0 h-full w-1.5 rounded-r-xl bg-gradient-to-b from-cyan-400 via-indigo-400 to-blue-500" />
                          )}
                          <span
                            className={[
                              'flex h-10 w-10 items-center justify-center rounded-xl transition shadow-inner shadow-black/30',
                              isActive
                                ? 'bg-gradient-to-br from-indigo-500/80 via-sky-500/70 to-cyan-500/70 text-white'
                                : 'bg-white/5 text-slate-300 border border-white/5 group-hover:border-white/10',
                            ].join(' ')}
                          >
                            <IconComponent size={20} />
                          </span>
                          <span className="flex-1">{name}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-2">
                <p className="px-2 text-[11px] uppercase tracking-[0.32em] text-slate-500">Support</p>
                {supportItems.map(({ icon: IconComponent, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    data-testid="sidebar-support"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 border border-white/5">
                      <IconComponent size={20} />
                    </span>
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-auto px-2 pb-8 pt-6">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/25 via-indigo-500/18 to-blue-500/18 p-4 shadow-lg shadow-black/30">
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <p className="text-sm font-semibold text-white drop-shadow">พัฒนาโดย {siteConfig.developerName}</p>
                <p className="mt-1 text-xs text-slate-200/90">พบปัญหาการใช้งานหรือมีคำแนะนำสามารถติดต่อได้ทาง Nzdev</p>
                <button className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                  Nzdev
                </button>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
