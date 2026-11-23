/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TopHeader } from './components/TopHeader';
import {
  DEFAULT_ROUTE_FOR_ROLE,
  MarksProvider,
  ROLE_ROUTES,
  useMarks,
} from './context/MarksContext';
import { AdminAssignments } from './pages/AdminAssignments';
import { AdminBackup } from './pages/AdminBackup';
import { AdminClassesSubjects } from './pages/AdminClassesSubjects';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStudents } from './pages/AdminStudents';
import { HodAnalytics } from './pages/HodAnalytics';
import { HodConsolidatedReport } from './pages/HodConsolidatedReport';
import { LoginPage } from './pages/LoginPage';
import { StudentMarksheet } from './pages/StudentMarksheet';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherMarksEntry } from './pages/TeacherMarksEntry';

function WorkspaceContent() {
  const { currentUser, activeRoute, navigate } = useMarks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  const isAuthorized = ROLE_ROUTES[currentUser.role].includes(activeRoute);

  const renderPage = () => {
    if (!isAuthorized) {
      return (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-lg mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Your role ({currentUser.role}) is not permitted to view this page.
          </p>
          <button
            type="button"
            onClick={() => navigate(DEFAULT_ROUTE_FOR_ROLE[currentUser.role])}
            className="mt-6 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeRoute) {
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-academics':
        return <AdminClassesSubjects />;
      case 'admin-students':
        return <AdminStudents />;
      case 'admin-assignments':
        return <AdminAssignments />;
      case 'admin-backup':
        return <AdminBackup />;
      case 'teacher-dashboard':
        return <TeacherDashboard />;
      case 'teacher-marks':
        return <TeacherMarksEntry />;
      case 'hod-analytics':
        return <HodAnalytics />;
      case 'hod-reports':
        return <HodConsolidatedReport />;
      case 'student-marksheet':
        return <StudentMarksheet />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 px-6 py-8 sm:px-10 sm:py-10 max-w-6xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MarksProvider>
      <WorkspaceContent />
      <ToastContainer />
    </MarksProvider>
  );
}
