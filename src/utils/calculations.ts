import {
  AcademicClass,
  ExamType,
  GradeLetter,
  MarkRecord,
  Student,
  StudentExamSummary,
  Subject,
  SubjectMarkDetail,
} from '../types';

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MID_TERM_1: 'Mid-Term 1',
  MID_TERM_2: 'Mid-Term 2',
  SEMESTER_END: 'Semester End',
};

export const ACADEMIC_YEARS = [
  '2026-2027 - Semester III',
  '2026-2027 - Semester IV',
  '2025-2026 - Semester II',
];

export function calculateGrade(
  percentage: number,
  hasFailedAnySubject: boolean
): { grade: GradeLetter; label: string } {
  if (hasFailedAnySubject || percentage < 40) {
    return { grade: 'F', label: 'Fail' };
  }
  if (percentage >= 90) {
    return { grade: 'O', label: 'Outstanding' };
  }
  if (percentage >= 80) {
    return { grade: 'A+', label: 'Excellent' };
  }
  if (percentage >= 70) {
    return { grade: 'A', label: 'Very Good' };
  }
  if (percentage >= 60) {
    return { grade: 'B+', label: 'Good' };
  }
  if (percentage >= 50) {
    return { grade: 'B', label: 'Above Average' };
  }
  return { grade: 'C', label: 'Pass' };
}

export function computeStudentExamSummary(
  student: Student,
  subjects: Subject[],
  marks: MarkRecord[],
  examType: ExamType,
  options: { onlyPublished?: boolean; academicClass?: AcademicClass } = {}
): StudentExamSummary {
  const { onlyPublished = false, academicClass } = options;

  const subjectDetails: SubjectMarkDetail[] = subjects.map((subject) => {
    const record =
      marks.find(
        (m) =>
          m.studentId === student.id &&
          m.subjectId === subject.id &&
          m.examType === examType
      ) ?? null;

    if (!record) {
      return {
        subject,
        record: null,
        marksObtained: null,
        status: 'PENDING',
        passed: null,
      };
    }

    if (onlyPublished && record.status !== 'PUBLISHED') {
      return {
        subject,
        record: null,
        marksObtained: null,
        status: 'PENDING',
        passed: null,
      };
    }

    const passed = record.marksObtained >= subject.passMarks;

    return {
      subject,
      record,
      marksObtained: record.marksObtained,
      status: record.status,
      passed,
    };
  });

  const evaluatedDetails = subjectDetails.filter((d) => d.marksObtained !== null);
  const totalObtained = evaluatedDetails.reduce(
    (sum, d) => sum + (d.marksObtained ?? 0),
    0
  );
  const totalMax = evaluatedDetails.reduce((sum, d) => sum + d.subject.maxMarks, 0);
  const percentage =
    totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  const hasFailedSubject = evaluatedDetails.some((d) => d.passed === false);
  const hasDraft = subjectDetails.some((d) => d.status === 'DRAFT');
  const isComplete =
    subjects.length > 0 && evaluatedDetails.length === subjects.length;

  const { grade, label } =
    evaluatedDetails.length > 0
      ? calculateGrade(percentage, hasFailedSubject)
      : { grade: 'F' as GradeLetter, label: 'Pending' };

  const overallPassed =
    evaluatedDetails.length > 0 && !hasFailedSubject && percentage >= 40;

  return {
    student,
    academicClass,
    subjectDetails,
    totalObtained,
    totalMax,
    evaluatedSubjectsCount: evaluatedDetails.length,
    totalSubjectsCount: subjects.length,
    percentage,
    grade,
    gradeLabel: label,
    overallPassed,
    isComplete,
    hasDraft,
    hasFailedSubject,
  };
}

export interface SubjectAnalytics {
  subject: Subject;
  totalStudents: number;
  enteredCount: number;
  publishedCount: number;
  draftCount: number;
  pendingCount: number;
  passCount: number;
  failCount: number;
  averagePercentage: number;
  highestMark: number | null;
}

export function computeSubjectAnalytics(
  classStudents: Student[],
  subject: Subject,
  marks: MarkRecord[],
  examType: ExamType
): SubjectAnalytics {
  const totalStudents = classStudents.length;
  let enteredCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let passCount = 0;
  let failCount = 0;
  let sumMarks = 0;
  let highestMark: number | null = null;

  for (const student of classStudents) {
    const rec = marks.find(
      (m) =>
        m.studentId === student.id &&
        m.subjectId === subject.id &&
        m.examType === examType
    );

    if (rec) {
      enteredCount++;
      sumMarks += rec.marksObtained;
      if (highestMark === null || rec.marksObtained > highestMark) {
        highestMark = rec.marksObtained;
      }
      if (rec.status === 'PUBLISHED') publishedCount++;
      else draftCount++;

      if (rec.marksObtained >= subject.passMarks) {
        passCount++;
      } else {
        failCount++;
      }
    }
  }

  const pendingCount = totalStudents - enteredCount;
  const averagePercentage =
    enteredCount > 0 && subject.maxMarks > 0
      ? Number(((sumMarks / (enteredCount * subject.maxMarks)) * 100).toFixed(2))
      : 0;

  return {
    subject,
    totalStudents,
    enteredCount,
    publishedCount,
    draftCount,
    pendingCount,
    passCount,
    failCount,
    averagePercentage,
    highestMark,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  // Neutralize formula injection prefixes (=, +, -, @, tab, CR)
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function exportConsolidatedCSV(
  summaries: StudentExamSummary[],
  subjects: Subject[],
  className: string,
  examType: ExamType
): void {
  const headers = [
    'Roll Number',
    'Student Name',
    'Class',
    ...subjects.map((s) => `${s.subjectCode} - ${s.subjectName} (/${s.maxMarks})`),
    'Total Obtained',
    'Total Max',
    'Percentage (%)',
    'Grade',
    'Result Status',
  ];

  const rows = summaries.map((summary) => {
    const subjectCells = subjects.map((subj) => {
      const detail = summary.subjectDetails.find((d) => d.subject.id === subj.id);
      if (!detail || detail.marksObtained === null) return 'Pending';
      return detail.status === 'DRAFT'
        ? `${detail.marksObtained} (Draft)`
        : String(detail.marksObtained);
    });

    return [
      summary.student.rollNo,
      summary.student.name,
      summary.academicClass?.name ?? className,
      ...subjectCells,
      String(summary.totalObtained),
      String(summary.totalMax),
      summary.evaluatedSubjectsCount > 0 ? summary.percentage.toFixed(2) : '0.00',
      summary.grade,
      summary.evaluatedSubjectsCount === 0
        ? 'PENDING'
        : summary.overallPassed
        ? 'PASS'
        : 'FAIL',
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeClass = className.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const safeExam = EXAM_TYPE_LABELS[examType].replace(/\s+/g, '_');
  link.href = url;
  link.download = `Consolidated_Marks_${safeClass}_${safeExam}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
