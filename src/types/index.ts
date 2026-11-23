export type UserRole = 'ADMIN' | 'TEACHER' | 'HOD' | 'STUDENT';

export type ExamType = 'MID_TERM_1' | 'MID_TERM_2' | 'SEMESTER_END';

export type ResultStatus = 'DRAFT' | 'PUBLISHED';

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  designation?: string;
  studentId?: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  semester: string;
  academicYear: string;
  department: string;
}

export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  credits: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  classId: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

export interface MarkRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  examType: ExamType;
  marksObtained: number;
  status: ResultStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface SystemState {
  version: string;
  academicYear: string;
  users: User[];
  classes: AcademicClass[];
  subjects: Subject[];
  students: Student[];
  assignments: TeacherAssignment[];
  marks: MarkRecord[];
  lastBackupAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export type AppRoute =
  | 'admin-dashboard'
  | 'admin-academics'
  | 'admin-students'
  | 'admin-assignments'
  | 'admin-backup'
  | 'teacher-dashboard'
  | 'teacher-marks'
  | 'hod-analytics'
  | 'hod-reports'
  | 'student-marksheet';

export interface SubjectMarkDetail {
  subject: Subject;
  record: MarkRecord | null;
  marksObtained: number | null;
  status: ResultStatus | 'PENDING';
  passed: boolean | null;
}

export interface StudentExamSummary {
  student: Student;
  academicClass?: AcademicClass;
  subjectDetails: SubjectMarkDetail[];
  totalObtained: number;
  totalMax: number;
  evaluatedSubjectsCount: number;
  totalSubjectsCount: number;
  percentage: number;
  grade: GradeLetter;
  gradeLabel: string;
  overallPassed: boolean;
  isComplete: boolean;
  hasDraft: boolean;
  hasFailedSubject: boolean;
}
