import React, { useState, useEffect, useRef } from 'react';
import OverallAnalytics from '../components/analytics/OverallAnalytics';
import { useApp } from '../context/AppContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import Icon from '../icons/Icon';

const DashboardView = () => {
  const { subjects, openModal, allStudents, isLoadingStudents, fetchAllStudents } = useApp();
  const { siteConfig } = useSiteConfig();
  const handleStudentClick = (student, grade) => openModal('studentProfile', { student, grade });

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Fetch all students on mount (cached in context)
  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  // Handle Search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const results = allStudents.filter(student => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const studentId = (student.studentId || '').toString();
      const studentNumber = (student.studentNumber || '').toString();

      return fullName.includes(lowerTerm) ||
        studentId.includes(lowerTerm) ||
        studentNumber.includes(lowerTerm);
    });
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, allStudents]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden gap-6">
      {/* Announcement Banner */}
      {siteConfig.announcement?.enabled && siteConfig.announcement?.message && (
        <div className={`relative z-20 flex items-start gap-3 rounded-xl border p-4 ${siteConfig.announcement.type === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' :
            siteConfig.announcement.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' :
              siteConfig.announcement.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' :
                'border-sky-500/30 bg-sky-500/10 text-sky-200'
          }`}>
          <Icon name={
            siteConfig.announcement.type === 'error' ? 'AlertCircle' :
              siteConfig.announcement.type === 'warning' ? 'AlertTriangle' :
                siteConfig.announcement.type === 'success' ? 'CheckCircle' :
                  'Info'
          } size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium leading-relaxed">{siteConfig.announcement.message}</p>
        </div>
      )}

      {/* Search Bar Section */}
      <div className="relative z-20" ref={searchRef}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Icon name="Search" className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-slate-200 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-teal-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
            placeholder={isLoadingStudents ? "กำลังโหลดข้อมูลนักเรียน..." : "ค้นหานักเรียน (ชื่อ, สกุล, หรือเลขที่)..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
            disabled={isLoadingStudents}
          />
          {isLoadingStudents && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <Icon name="Loader2" className="animate-spin text-teal-400" size={18} />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b]/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5">
            <div className="max-h-[300px] overflow-y-auto py-2">
              {searchResults.map((student) => (
                <button
                  key={`${student.grade}-${student.id}`}
                  onClick={() => {
                    handleStudentClick(student, student.grade);
                    setIsSearching(false);
                    setSearchTerm('');
                  }}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${student.gender === 'female'
                    ? 'from-pink-500 to-rose-500'
                    : 'from-blue-500 to-cyan-500'
                    } text-white shadow-lg`}>
                    <span className="text-sm font-bold">{student.studentNumber || '?'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-200">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-slate-400">
                      ชั้น {student.grade} • เลขที่ {student.studentNumber} {student.studentId ? `• รหัส ${student.studentId}` : ''}
                    </div>
                  </div>
                  <Icon name="ChevronRight" className="text-slate-500" size={16} />
                </button>
              ))}
            </div>
          </div>
        )}

        {isSearching && searchTerm && searchResults.length === 0 && !isLoadingStudents && (
          <div className="absolute mt-2 w-full rounded-2xl border border-white/10 bg-[#1e293b]/95 backdrop-blur-xl p-4 text-center text-slate-400 shadow-xl">
            ไม่พบนักเรียนที่ค้นหา
          </div>
        )}
      </div>

      <OverallAnalytics subjects={subjects} onStudentClick={handleStudentClick} />
    </div>
  );
};

export default DashboardView;

