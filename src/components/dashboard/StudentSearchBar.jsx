import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '../../icons/Icon';

const StudentSearchBar = ({ students, isLoading, onStudentSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const results = students.filter((student) => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const studentId = (student.studentId || '').toString();
      const studentNumber = (student.studentNumber || '').toString();

      return (
        fullName.includes(lowerTerm) ||
        studentId.includes(lowerTerm) ||
        studentNumber.includes(lowerTerm)
      );
    });
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, students]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (student) => {
    onStudentSelect(student);
    setIsSearching(false);
    setSearchTerm('');
  };

  return (
    <div className="relative z-20" ref={searchRef}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon name="Search" className="text-slate-400" size={20} />
        </div>
        <input
          type="text"
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-slate-200 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-teal-500/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
          placeholder={isLoading ? 'กำลังโหลดข้อมูลนักเรียน...' : 'ค้นหานักเรียน (ชื่อ, สกุล, หรือเลขที่)...'}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsSearching(true);
          }}
          onFocus={() => setIsSearching(true)}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <Icon name="Loader2" className="animate-spin text-teal-400" size={18} />
          </div>
        )}
      </div>

      {isSearching && searchResults.length > 0 && (
        <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b]/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5">
          <div className="max-h-[300px] overflow-y-auto py-2">
            {searchResults.map((student) => (
              <button
                key={`${student.grade}-${student.id}`}
                onClick={() => handleSelect(student)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${
                    student.gender === 'female' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500'
                  } text-white shadow-lg`}
                >
                  <span className="text-sm font-bold">{student.studentNumber || '?'}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-200">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-slate-400">
                    ชั้น {student.grade} • เลขที่ {student.studentNumber}{' '}
                    {student.studentId ? `• รหัส ${student.studentId}` : ''}
                  </div>
                </div>
                <Icon name="ChevronRight" className="text-slate-500" size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearching && searchTerm && searchResults.length === 0 && !isLoading && (
        <div className="absolute mt-2 w-full rounded-2xl border border-white/10 bg-[#1e293b]/95 backdrop-blur-xl p-4 text-center text-slate-400 shadow-xl">
          ไม่พบนักเรียนที่ค้นหา
        </div>
      )}
    </div>
  );
};

StudentSearchBar.propTypes = {
  students: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onStudentSelect: PropTypes.func.isRequired,
};

export default StudentSearchBar;
