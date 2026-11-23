import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { downloadBackupFile, storageService } from '../services/storageService';
import {
  AcademicClass,
  AppRoute,
  ExamType,
  MarkRecord,
  ResultStatus,
  Student,
  Subject,
  SystemState,
  TeacherAssignment,
  ToastMessage,
  User,
  UserRole,
} from '../types';

export const ROLE_ROUTES: Record<UserRole, AppRoute[]> = {
  ADMIN: [
    'admin-dashboard',
    'admin-academics',
    'admin-students',
    'admin-assignments',
    'admin-backup',
  ],
  TEACHER: ['teacher-dashboard', 'teacher-marks'],
  HOD: ['hod-analytics', 'hod-reports'],
  STUDENT: ['student-marksheet'],
};

export const DEFAULT_ROUTE_FOR_ROLE: Record<UserRole, AppRoute> = {
  ADMIN: 'admin-dashboard',
  TEACHER: 'teacher-dashboard',
  HOD: 'hod-analytics',
  STUDENT: 'student-marksheet',
};

interface MarksContextValue {
  state: SystemState;
  currentUser: User | null;
  activeRoute: AppRoute;
  activeAcademicYear: string;
  rollSearchQuery: string;
  toasts: ToastMessage[];
  preselectedGrid: { classId: string; subjectId: string } | null;

  setActiveAcademicYear: (year: string) => void;
  setRollSearchQuery: (q: string) => void;
  setPreselectedGrid: (grid: { classId: string; subjectId: string } | null) => void;

  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  login: (email: string, password: string) => boolean;
  loginAsDemo: (role: UserRole, specificUserId?: string) => void;
  logout: () => void;
  navigate: (route: AppRoute) => boolean;

  // Admin: Classes
  addClass: (cls: Omit<AcademicClass, 'id'>) => boolean;
  updateClass: (cls: AcademicClass) => boolean;
  deleteClass: (classId: string) => boolean;

  // Admin: Subjects
  addSubject: (subj: Omit<Subject, 'id'>) => boolean;
  updateSubject: (subj: Subject) => boolean;
  deleteSubject: (subjectId: string) => boolean;

  // Admin: Students
  addStudent: (student: Omit<Student, 'id'>) => { ok: boolean; error?: string };
  updateStudent: (student: Student) => { ok: boolean; error?: string };
  deleteStudent: (studentId: string) => boolean;

  // Admin: Teacher Assignments
  assignTeacher: (teacherId: string, classId: string, subjectId: string) => { ok: boolean; error?: string };
  removeAssignment: (assignmentId: string) => boolean;

  // Teacher: Marks Entry & Publishing
  saveBatchMarks: (
    classId: string,
    subjectId: string,
    examType: ExamType,
    entries: Array<{ studentId: string; marksObtained: number }>,
    targetStatus: ResultStatus
  ) => boolean;
  togglePublishStatus: (
    classId: string,
    subjectId: string,
    examType: ExamType,
    targetStatus: ResultStatus
  ) => boolean;

  // Admin: Backup & Recovery
  exportBackup: () => void;
  restoreBackup: (rawJson: string) => { ok: boolean; error?: string };
  resetDemoData: () => void;
}

const MarksContext = createContext<MarksContextValue | undefined>(undefined);

const SESSION_USER_KEY = 'acadledger_session_user_id';

export function MarksProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SystemState>(() => storageService.loadState());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(SESSION_USER_KEY);
    } catch {
      return null;
    }
  });

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === currentUserId) ?? null,
    [state.users, currentUserId]
  );

  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    if (currentUser) {
      return DEFAULT_ROUTE_FOR_ROLE[currentUser.role];
    }
    return 'admin-dashboard';
  });

  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(
    () => state.academicYear
  );
  const [rollSearchQuery, setRollSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [preselectedGrid, setPreselectedGrid] = useState<{
    classId: string;
    subjectId: string;
  } | null>(null);

  useEffect(() => {
    storageService.saveState(state);
  }, [state]);

  useEffect(() => {
    if (currentUser) {
      const allowed = ROLE_ROUTES[currentUser.role];
      if (!allowed.includes(activeRoute)) {
        setActiveRoute(DEFAULT_ROUTE_FOR_ROLE[currentUser.role]);
      }
    }
  }, [currentUser, activeRoute]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const requireRole = useCallback(
    (allowedRoles: UserRole[], actionLabel: string): boolean => {
      if (!currentUser) {
        pushToast({
          type: 'error',
          title: 'Authentication Required',
          message: `Please sign in to perform "${actionLabel}".`,
        });
        return false;
      }
      if (!allowedRoles.includes(currentUser.role)) {
        pushToast({
          type: 'error',
          title: 'Access Denied (RBAC)',
          message: `Role "${currentUser.role}" is not authorized for ${actionLabel}.`,
        });
        return false;
      }
      return true;
    },
    [currentUser, pushToast]
  );

  const login = useCallback(
    (email: string, password: string): boolean => {
      const normalized = email.trim().toLowerCase();
      const matched = state.users.find(
        (u) => u.email.toLowerCase() === normalized && u.password === password
      );
      if (!matched) {
        pushToast({
          type: 'error',
          title: 'Invalid Credentials',
          message: 'No institutional account matched that email and password.',
        });
        return false;
      }
      setCurrentUserId(matched.id);
      window.localStorage.setItem(SESSION_USER_KEY, matched.id);
      setActiveRoute(DEFAULT_ROUTE_FOR_ROLE[matched.role]);
      setRollSearchQuery('');
      setPreselectedGrid(null);
      pushToast({
        type: 'success',
        title: `Signed in as ${matched.name}`,
        message: `Active role: ${matched.role}`,
      });
      return true;
    },
    [state.users, pushToast]
  );

  const loginAsDemo = useCallback(
    (role: UserRole, specificUserId?: string) => {
      const user = specificUserId
        ? state.users.find((u) => u.id === specificUserId && u.role === role)
        : state.users.find((u) => u.role === role);
      if (!user) {
        pushToast({
          type: 'error',
          title: 'Demo Account Unavailable',
          message: `No user found for role ${role}.`,
        });
        return;
      }
      setCurrentUserId(user.id);
      window.localStorage.setItem(SESSION_USER_KEY, user.id);
      setActiveRoute(DEFAULT_ROUTE_FOR_ROLE[user.role]);
      setRollSearchQuery('');
      setPreselectedGrid(null);
      pushToast({
        type: 'info',
        title: `Switched to ${user.name}`,
        message: `${user.designation ?? user.role} workspace loaded.`,
      });
    },
    [state.users, pushToast]
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    window.localStorage.removeItem(SESSION_USER_KEY);
    setRollSearchQuery('');
    setPreselectedGrid(null);
  }, []);

  const navigate = useCallback(
    (route: AppRoute): boolean => {
      if (!currentUser) return false;
      const allowed = ROLE_ROUTES[currentUser.role];
      if (!allowed.includes(route)) {
        pushToast({
          type: 'error',
          title: 'Access Denied (RBAC)',
          message: `Your role (${currentUser.role}) cannot access that module.`,
        });
        return false;
      }
      setActiveRoute(route);
      return true;
    },
    [currentUser, pushToast]
  );

  // Admin: Classes
  const addClass = useCallback(
    (cls: Omit<AcademicClass, 'id'>): boolean => {
      if (!requireRole(['ADMIN'], 'Create Class')) return false;
      const newClass: AcademicClass = {
        ...cls,
        id: `cls-${Date.now()}`,
      };
      setState((prev) => ({ ...prev, classes: [...prev.classes, newClass] }));
      pushToast({
        type: 'success',
        title: 'Class Created',
        message: `${cls.name} (${cls.code}) has been added.`,
      });
      return true;
    },
    [requireRole, pushToast]
  );

  const updateClass = useCallback(
    (cls: AcademicClass): boolean => {
      if (!requireRole(['ADMIN'], 'Update Class')) return false;
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((c) => (c.id === cls.id ? cls : c)),
      }));
      pushToast({
        type: 'success',
        title: 'Class Updated',
        message: `${cls.name} changes saved.`,
      });
      return true;
    },
    [requireRole, pushToast]
  );

  const deleteClass = useCallback(
    (classId: string): boolean => {
      if (!requireRole(['ADMIN'], 'Delete Class')) return false;
      setState((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== classId),
        assignments: prev.assignments.filter((a) => a.classId !== classId),
        marks: prev.marks.filter((m) => m.classId !== classId),
      }));
      pushToast({
        type: 'info',
        title: 'Class Removed',
        message: 'Class and associated assignments removed.',
      });
      return true;
    },
    [requireRole, pushToast]
  );

  // Admin: Subjects
  const addSubject = useCallback(
    (subj: Omit<Subject, 'id'>): boolean => {
      if (!requireRole(['ADMIN'], 'Create Subject')) return false;
      const duplicate = state.subjects.some(
        (s) => s.subjectCode.trim().toLowerCase() === subj.subjectCode.trim().toLowerCase()
      );
      if (duplicate) {
        pushToast({
          type: 'error',
          title: 'Duplicate Subject Code',
          message: `Subject code ${subj.subjectCode} already exists.`,
        });
        return false;
      }
      const newSubj: Subject = { ...subj, id: `sub-${Date.now()}` };
      setState((prev) => ({ ...prev, subjects: [...prev.subjects, newSubj] }));
      pushToast({
        type: 'success',
        title: 'Subject Configured',
        message: `${subj.subjectCode} — ${subj.subjectName} added.`,
      });
      return true;
    },
    [requireRole, state.subjects, pushToast]
  );

  const updateSubject = useCallback(
    (subj: Subject): boolean => {
      if (!requireRole(['ADMIN'], 'Update Subject')) return false;
      const duplicate = state.subjects.some(
        (s) =>
          s.id !== subj.id &&
          s.subjectCode.trim().toLowerCase() === subj.subjectCode.trim().toLowerCase()
      );
      if (duplicate) {
        pushToast({
          type: 'error',
          title: 'Duplicate Subject Code',
          message: `Subject code ${subj.subjectCode} belongs to another subject.`,
        });
        return false;
      }
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === subj.id ? subj : s)),
      }));
      pushToast({
        type: 'success',
        title: 'Subject Updated',
        message: `${subj.subjectCode} configuration saved.`,
      });
      return true;
    },
    [requireRole, state.subjects, pushToast]
  );

  const deleteSubject = useCallback(
    (subjectId: string): boolean => {
      if (!requireRole(['ADMIN'], 'Delete Subject')) return false;
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subjectId),
        assignments: prev.assignments.filter((a) => a.subjectId !== subjectId),
        marks: prev.marks.filter((m) => m.subjectId !== subjectId),
      }));
      pushToast({
        type: 'info',
        title: 'Subject Removed',
        message: 'Subject deleted from curriculum.',
      });
      return true;
    },
    [requireRole, pushToast]
  );

  // Admin: Students (Unique Roll No validation)
  const addStudent = useCallback(
    (student: Omit<Student, 'id'>): { ok: boolean; error?: string } => {
      if (!requireRole(['ADMIN'], 'Add Student')) {
        return { ok: false, error: 'Unauthorized' };
      }
      const normalizedRoll = student.rollNo.trim().toUpperCase();
      const duplicateRoll = state.students.some(
        (s) => s.rollNo.trim().toUpperCase() === normalizedRoll
      );
      if (duplicateRoll) {
        const error = `Roll Number "${normalizedRoll}" is already assigned to another student.`;
        pushToast({ type: 'error', title: 'Duplicate Roll Number', message: error });
        return { ok: false, error };
      }
      const newStudentId = `stu-${Date.now()}`;
      const newStudent: Student = {
        ...student,
        id: newStudentId,
        rollNo: normalizedRoll,
      };
      const newStudentUser: User = {
        id: `usr-stu-${Date.now()}`,
        name: student.name,
        email: student.email.trim().toLowerCase(),
        password: 'password123',
        role: 'STUDENT',
        department: 'Computer Science & Engineering',
        designation: 'Undergraduate Student',
        studentId: newStudentId,
      };
      setState((prev) => ({
        ...prev,
        students: [...prev.students, newStudent],
        users: [...prev.users, newStudentUser],
      }));
      pushToast({
        type: 'success',
        title: 'Student Registered',
        message: `${student.name} (${normalizedRoll}) added to directory.`,
      });
      return { ok: true };
    },
    [requireRole, state.students, pushToast]
  );

  const updateStudent = useCallback(
    (student: Student): { ok: boolean; error?: string } => {
      if (!requireRole(['ADMIN'], 'Update Student')) {
        return { ok: false, error: 'Unauthorized' };
      }
      const normalizedRoll = student.rollNo.trim().toUpperCase();
      const duplicateRoll = state.students.some(
        (s) => s.id !== student.id && s.rollNo.trim().toUpperCase() === normalizedRoll
      );
      if (duplicateRoll) {
        const error = `Roll Number "${normalizedRoll}" is already in use.`;
        pushToast({ type: 'error', title: 'Duplicate Roll Number', message: error });
        return { ok: false, error };
      }
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === student.id ? { ...student, rollNo: normalizedRoll } : s
        ),
        users: prev.users.map((u) =>
          u.studentId === student.id
            ? { ...u, name: student.name, email: student.email.trim().toLowerCase() }
            : u
        ),
      }));
      pushToast({
        type: 'success',
        title: 'Student Updated',
        message: `${student.name} (${normalizedRoll}) record saved.`,
      });
      return { ok: true };
    },
    [requireRole, state.students, pushToast]
  );

  const deleteStudent = useCallback(
    (studentId: string): boolean => {
      if (!requireRole(['ADMIN'], 'Delete Student')) return false;
      setState((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== studentId),
        users: prev.users.filter((u) => u.studentId !== studentId),
        marks: prev.marks.filter((m) => m.studentId !== studentId),
      }));
      pushToast({
        type: 'info',
        title: 'Student Removed',
        message: 'Student account and marks deleted.',
      });
      return true;
    },
    [requireRole, pushToast]
  );

  // Admin: Teacher Assignments
  const assignTeacher = useCallback(
    (
      teacherId: string,
      classId: string,
      subjectId: string
    ): { ok: boolean; error?: string } => {
      if (!requireRole(['ADMIN'], 'Assign Teacher')) {
        return { ok: false, error: 'Unauthorized' };
      }
      const exists = state.assignments.some(
        (a) =>
          a.teacherId === teacherId &&
          a.classId === classId &&
          a.subjectId === subjectId
      );
      if (exists) {
        const error = 'This teacher is already assigned to that class & subject.';
        pushToast({ type: 'warning', title: 'Duplicate Assignment', message: error });
        return { ok: false, error };
      }
      const newAssignment: TeacherAssignment = {
        id: `asg-${Date.now()}`,
        teacherId,
        classId,
        subjectId,
      };
      setState((prev) => ({
        ...prev,
        assignments: [...prev.assignments, newAssignment],
      }));
      pushToast({
        type: 'success',
        title: 'Assignment Created',
        message: 'Faculty member assigned to class & subject.',
      });
      return { ok: true };
    },
    [requireRole, state.assignments, pushToast]
  );

  const removeAssignment = useCallback(
    (assignmentId: string): boolean => {
      if (!requireRole(['ADMIN'], 'Remove Assignment')) return false;
      setState((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.id !== assignmentId),
      }));
      pushToast({
        type: 'info',
        title: 'Assignment Removed',
        message: 'Teacher allocation updated.',
      });
      return true;
    },
    [requireRole, pushToast]
  );

  // Teacher: Batch Save Marks & Publish
  const saveBatchMarks = useCallback(
    (
      classId: string,
      subjectId: string,
      examType: ExamType,
      entries: Array<{ studentId: string; marksObtained: number }>,
      targetStatus: ResultStatus
    ): boolean => {
      if (!requireRole(['TEACHER'], 'Save Student Marks')) return false;
      const isAssigned = state.assignments.some(
        (a) =>
          a.teacherId === currentUser?.id &&
          a.classId === classId &&
          a.subjectId === subjectId
      );
      if (!isAssigned) {
        pushToast({
          type: 'error',
          title: 'Assignment Restricted',
          message: 'You are not assigned to this Class & Subject pair.',
        });
        return false;
      }
      const subject = state.subjects.find((s) => s.id === subjectId);
      if (!subject) return false;

      for (const entry of entries) {
        if (
          Number.isNaN(entry.marksObtained) ||
          entry.marksObtained < 0 ||
          entry.marksObtained > subject.maxMarks
        ) {
          pushToast({
            type: 'error',
            title: 'Validation Error',
            message: `Marks must be between 0 and ${subject.maxMarks}.`,
          });
          return false;
        }
      }

      const now = new Date().toISOString();
      setState((prev) => {
        const updatedMarks = [...prev.marks];
        for (const entry of entries) {
          const idx = updatedMarks.findIndex(
            (m) =>
              m.studentId === entry.studentId &&
              m.classId === classId &&
              m.subjectId === subjectId &&
              m.examType === examType
          );
          if (idx >= 0) {
            updatedMarks[idx] = {
              ...updatedMarks[idx],
              marksObtained: entry.marksObtained,
              status: targetStatus,
              updatedAt: now,
              updatedBy: currentUser!.id,
            };
          } else {
            updatedMarks.push({
              id: `mrk-${Date.now()}-${entry.studentId}`,
              studentId: entry.studentId,
              classId,
              subjectId,
              examType,
              marksObtained: entry.marksObtained,
              status: targetStatus,
              updatedAt: now,
              updatedBy: currentUser!.id,
            });
          }
        }
        return { ...prev, marks: updatedMarks };
      });

      pushToast({
        type: 'success',
        title: targetStatus === 'PUBLISHED' ? 'Results Published' : 'Draft Marks Saved',
        message: `${entries.length} student record(s) saved as ${
          targetStatus === 'PUBLISHED' ? 'Published' : 'Draft'
        }.`,
      });
      return true;
    },
    [requireRole, state.assignments, state.subjects, currentUser, pushToast]
  );

  const togglePublishStatus = useCallback(
    (
      classId: string,
      subjectId: string,
      examType: ExamType,
      targetStatus: ResultStatus
    ): boolean => {
      if (!requireRole(['TEACHER'], 'Publish / Unpublish Results')) return false;
      const isAssigned = state.assignments.some(
        (a) =>
          a.teacherId === currentUser?.id &&
          a.classId === classId &&
          a.subjectId === subjectId
      );
      if (!isAssigned) {
        pushToast({
          type: 'error',
          title: 'Access Denied',
          message: 'You can only publish subjects assigned to you.',
        });
        return false;
      }

      const matchingCount = state.marks.filter(
        (m) =>
          m.classId === classId &&
          m.subjectId === subjectId &&
          m.examType === examType
      ).length;

      if (matchingCount === 0) {
        pushToast({
          type: 'warning',
          title: 'No Marks Found',
          message: 'Enter and save marks before toggling publication status.',
        });
        return false;
      }

      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        marks: prev.marks.map((m) =>
          m.classId === classId &&
          m.subjectId === subjectId &&
          m.examType === examType
            ? { ...m, status: targetStatus, updatedAt: now, updatedBy: currentUser!.id }
            : m
        ),
      }));

      pushToast({
        type: 'success',
        title:
          targetStatus === 'PUBLISHED' ? 'Results Published' : 'Reverted to Draft',
        message: `${matchingCount} mark record(s) updated to ${targetStatus}.`,
      });
      return true;
    },
    [requireRole, state.assignments, state.marks, currentUser, pushToast]
  );

  // Admin: Backup & Restore
  const exportBackup = useCallback(() => {
    if (!requireRole(['ADMIN'], 'Export Database Backup')) return;
    const timestamp = downloadBackupFile(state);
    setState((prev) => ({ ...prev, lastBackupAt: timestamp }));
    pushToast({
      type: 'success',
      title: 'Backup Downloaded',
      message: 'Timestamped JSON snapshot exported to your device.',
    });
  }, [requireRole, state, pushToast]);

  const restoreBackup = useCallback(
    (rawJson: string): { ok: boolean; error?: string } => {
      if (!requireRole(['ADMIN'], 'Restore Database Backup')) {
        return { ok: false, error: 'Unauthorized' };
      }
      const validation = storageService.validateBackupPayload(rawJson);
      if (!validation.valid || !validation.state) {
        pushToast({
          type: 'error',
          title: 'Restore Failed',
          message: validation.error ?? 'Invalid JSON backup.',
        });
        return { ok: false, error: validation.error };
      }
      setState(validation.state);
      storageService.saveState(validation.state);
      pushToast({
        type: 'success',
        title: 'Database Restored',
        message: `Restored ${validation.state.students.length} students and ${validation.state.marks.length} mark entries.`,
      });
      return { ok: true };
    },
    [requireRole, pushToast]
  );

  const resetDemoData = useCallback(() => {
    if (!requireRole(['ADMIN'], 'Reset Seed Data')) return;
    const fresh = storageService.resetToSeed();
    setState(fresh);
    pushToast({
      type: 'info',
      title: 'Seed Data Restored',
      message: 'System reverted to default university seed dataset.',
    });
  }, [requireRole, pushToast]);

  const value: MarksContextValue = {
    state,
    currentUser,
    activeRoute,
    activeAcademicYear,
    rollSearchQuery,
    toasts,
    preselectedGrid,
    setActiveAcademicYear,
    setRollSearchQuery,
    setPreselectedGrid,
    pushToast,
    dismissToast,
    login,
    loginAsDemo,
    logout,
    navigate,
    addClass,
    updateClass,
    deleteClass,
    addSubject,
    updateSubject,
    deleteSubject,
    addStudent,
    updateStudent,
    deleteStudent,
    assignTeacher,
    removeAssignment,
    saveBatchMarks,
    togglePublishStatus,
    exportBackup,
    restoreBackup,
    resetDemoData,
  };

  return <MarksContext.Provider value={value}>{children}</MarksContext.Provider>;
}

export function useMarks(): MarksContextValue {
  const ctx = useContext(MarksContext);
  if (!ctx) {
    throw new Error('useMarks must be used within a MarksProvider');
  }
  return ctx;
}
