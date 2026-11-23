import {
  BarChart3,
  BookOpen,
  ClipboardEdit,
  DatabaseBackup,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ScrollText,
  Users,
  X,
} from 'lucide-react';
import React from 'react';
import { useMarks } from '../context/MarksContext';
import { AppRoute, UserRole } from '../types';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    {
      route: 'admin-dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'admin-academics',
      label: 'Classes & Subjects',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'admin-students',
      label: 'Students',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'admin-assignments',
      label: 'Teacher Mapping',
      icon: <Link2 className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'admin-backup',
      label: 'Backup & Restore',
      icon: <DatabaseBackup className="w-4 h-4 shrink-0" />,
    },
  ],
  TEACHER: [
    {
      route: 'teacher-dashboard',
      label: 'My Courses',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'teacher-marks',
      label: 'Marks Entry',
      icon: <ClipboardEdit className="w-4 h-4 shrink-0" />,
    },
  ],
  HOD: [
    {
      route: 'hod-analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'hod-reports',
      label: 'Master Ledger',
      icon: <FileSpreadsheet className="w-4 h-4 shrink-0" />,
    },
  ],
  STUDENT: [
    {
      route: 'student-marksheet',
      label: 'Transcript',
      icon: <ScrollText className="w-4 h-4 shrink-0" />,
    },
  ],
};

const ROLE_DISPLAY: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  TEACHER: 'Faculty',
  HOD: 'HOD / Coordinator',
  STUDENT: 'Student',
};

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { currentUser, activeRoute, navigate, activeAcademicYear } = useMarks();

  if (!currentUser) return null;

  const navItems = NAV_BY_ROLE[currentUser.role];

  const handleNav = (route: AppRoute) => {
    navigate(route);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-gray-900/25 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-[240px] flex flex-col bg-[#F3F4F6] border-r border-gray-200/70 transition-transform duration-200 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Minimal Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight truncate">
              VVITU Portal
            </span>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-200/60"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white shadow-xs text-gray-900 font-semibold'
                    : 'text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quiet Session & Role Footer */}
        <div className="px-5 py-5 border-t border-gray-200/70 shrink-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {ROLE_DISPLAY[currentUser.role]}
          </p>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">
            {activeAcademicYear}
          </p>
        </div>
      </aside>
    </>
  );
}
