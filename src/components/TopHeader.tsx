import { ChevronDown, LogOut, Menu, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMarks } from '../context/MarksContext';
import { AppRoute, UserRole } from '../types';
import { ACADEMIC_YEARS } from '../utils/calculations';

const ROUTE_TITLES: Record<AppRoute, string> = {
  'admin-dashboard': 'System Overview',
  'admin-academics': 'Classes & Subjects',
  'admin-students': 'Student Directory',
  'admin-assignments': 'Teacher Mapping',
  'admin-backup': 'Backup & Recovery',
  'teacher-dashboard': 'Assigned Courses',
  'teacher-marks': 'Marks Entry Grid',
  'hod-analytics': 'Department Analytics',
  'hod-reports': 'Consolidated Ledger',
  'student-marksheet': 'Official Academic Transcript',
};

const ROLE_SHORT: Record<UserRole, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  HOD: 'HOD',
  STUDENT: 'Student',
};

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
  const {
    currentUser,
    activeRoute,
    activeAcademicYear,
    setActiveAcademicYear,
    loginAsDemo,
    logout,
  } = useMarks();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="no-print h-16 px-6 sm:px-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-[#F9FAFB]/80 backdrop-blur-xs shrink-0">
      {/* Left: Mobile Menu Trigger + Minimal Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-semibold text-gray-900 truncate">
          {ROUTE_TITLES[activeRoute]}
        </h2>
      </div>

      {/* Right: Sleek User Profile Pill + Role Switcher */}
      <div ref={profileRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setProfileOpen((p) => !p)}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-gray-200/80 shadow-xs hover:border-gray-300 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#1E1B4B] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            {currentUser.name
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0])
              .join('')}
          </div>
          <span className="text-xs font-medium text-gray-800 hidden sm:inline whitespace-nowrap">
            {currentUser.name}
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            · {ROLE_SHORT[currentUser.role]}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-900/10 z-40 py-2">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-900">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {currentUser.email}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <label
                htmlFor="header-session-select"
                className="block text-[11px] font-medium text-gray-500 mb-1.5"
              >
                Academic Session
              </label>
              <select
                id="header-session-select"
                value={activeAcademicYear}
                onChange={(e) => setActiveAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="px-1.5 pb-1.5 text-[11px] font-medium text-gray-400">
                Switch Role
              </p>
              <div className="space-y-1">
                {(
                  [
                    { role: 'ADMIN', label: 'Administrator', userId: 'usr-admin-1' },
                    { role: 'TEACHER', label: 'Teacher (Prof. Kavita)', userId: 'usr-teacher-1' },
                    { role: 'TEACHER', label: 'Teacher (Prof. Rajesh)', userId: 'usr-teacher-2' },
                    { role: 'HOD', label: 'HOD / Coordinator', userId: 'usr-hod-1' },
                    { role: 'STUDENT', label: 'Student (2025DAMBT11717)', userId: 'usr-student-1' },
                  ] as Array<{ role: UserRole; label: string; userId: string }>
                ).map((opt) => {
                  const active = currentUser.id === opt.userId;
                  return (
                    <button
                      key={opt.userId}
                      type="button"
                      onClick={() => {
                        loginAsDemo(opt.role, opt.userId);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
