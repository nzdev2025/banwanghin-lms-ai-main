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
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: House, name: 'แดชบอร์ด', path: '/' },
    { icon: Book, name: 'รายวิชา', path: '/subjects' },
    { icon: Calendar, name: 'ปฏิทินงาน/สอบ', path: '/calendar' },
    { icon: Users, name: 'นักเรียน', path: '/students' },
    { icon: FilePlus, name: 'AI ช่วยสร้าง', path: '/tools' },
    { icon: Briefcase, name: 'เครื่องมือช่วยสอน', path: '/classroom-tools' },
    { icon: Settings, name: 'ตั้งค่า', path: '/settings' },
  ];

  const supportItems = [
    { icon: MessageCircle, label: 'Community', href: '#' },
    { icon: LifeBuoy, label: 'Help & Support', href: '#' },
  ];

  return (
    <aside className="hidden lg:flex w-[270px] flex-col border-r border-white/10 bg-[#0f1424]/80 text-slate-200 backdrop-blur-xl">
      <div className="px-6 pt-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-500 text-xl font-semibold text-[#0f1424]">
            AI
          </div>
          <div>
            <p className="text-lg font-bold text-white">KruKit AI</p>
            <p className="text-xs text-slate-400">โรงเรียนบ้านวังหิน</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto pr-1">
            <p className="px-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              Main Menu
            </p>
            <ul className="mt-4 space-y-2">
              {navItems.map(({ icon: IconComponent, name, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/90 via-sky-500/80 to-cyan-500/80 text-white shadow-lg shadow-indigo-800/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            'flex h-10 w-10 items-center justify-center rounded-xl transition',
                            isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-300',
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
              <p className="px-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                Support
              </p>
              {supportItems.map(({ icon: IconComponent, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                    <IconComponent size={20} />
                  </span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-auto px-2 pb-8 pt-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-blue-500/20 p-4">
              <p className="text-sm font-semibold text-white">พัฒนาโดย Wasin Suksuwan</p>
              <p className="mt-1 text-xs text-slate-300">
                พบปัญหาการใช้งานหรือมีคำแนะนำสามารถติดต่อได้ทาง Nzdev
              </p>
              <button className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                Nzdev
              </button>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
