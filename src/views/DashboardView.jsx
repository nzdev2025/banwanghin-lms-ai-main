import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';
import { grades } from '../constants/data';
import OverallAnalytics from '../components/analytics/OverallAnalytics';
import { useApp } from '../context/AppContext';
import Icon from '../icons/Icon';

const DashboardView = () => {
  const { subjects, openModal } = useApp();
  const handleStudentClick = (student, grade) => openModal('studentProfile', { student, grade });

  // Search State
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const searchRef = useRef(null);

  // Fetch all students on mount
  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!db) return;
      setIsLoadingStudents(true);
      let studentsData = [];

      try {
        const promises = grades.map(async (grade) => {
          const path = `artifacts/${appId}/public/data/rosters/${grade}/students`;
          const querySnapshot = await getDocs(collection(db, path));
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            grade // Attach grade to student object for reference
          }));
        });

        const results = await Promise.all(promises);
        studentsData = results.flat();
      } catch (error) {
        console.error("Error fetching students for search:", error);
      } finally {
        setAllStudents(studentsData);
        setIsLoadingStudents(false);
      }
    };

    fetchAllStudents();
  }, []);

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

