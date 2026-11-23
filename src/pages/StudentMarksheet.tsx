import { Clock, GraduationCap, Printer, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { useMarks } from '../context/MarksContext';
import { ExamType } from '../types';
import { computeStudentExamSummary, EXAM_TYPE_LABELS } from '../utils/calculations';

export function StudentMarksheet() {
  const { state, currentUser, activeAcademicYear } = useMarks();
  const [examType, setExamType] = useState<ExamType>('SEMESTER_END');

  const studentRecord = useMemo(() => {
    if (!currentUser || currentUser.role !== 'STUDENT' || !currentUser.studentId) {
      return null;
    }
    return state.students.find((s) => s.id === currentUser.studentId) ?? null;
  }, [currentUser, state.students]);

  const studentClass = useMemo(() => {
    if (!studentRecord) return undefined;
    return state.classes.find((c) => c.id === studentRecord.classId);
  }, [studentRecord, state.classes]);

  const summary = useMemo(() => {
    if (!studentRecord) return null;
    return computeStudentExamSummary(
      studentRecord,
      state.subjects,
      state.marks,
      examType,
      { onlyPublished: true, academicClass: studentClass }
    );
  }, [studentRecord, state.subjects, state.marks, examType, studentClass]);

  if (!studentRecord || !summary) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-5 h-5" />}
        title="Student Profile Not Linked"
        description="Your account is not linked to an active student enrollment record."
      />
    );
  }

  const unpublishedCount =
    summary.totalSubjectsCount - summary.evaluatedSubjectsCount;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Official Academic Transcript
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified published marks for {studentRecord.name} ({studentRecord.rollNo}).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            aria-label="Select Examination"
            className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {(Object.keys(EXAM_TYPE_LABELS) as ExamType[]).map((key) => (
              <option key={key} value={key}>
                {EXAM_TYPE_LABELS[key]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Transcript</span>
          </button>
        </div>
      </div>

      {/* Unpublished Subjects Notice */}
      {unpublishedCount > 0 && (
        <div className="no-print flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 text-amber-800 text-xs sm:text-sm">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {unpublishedCount} subject(s) for {EXAM_TYPE_LABELS[examType]} are
            awaiting faculty publication and are excluded until released.
          </span>
        </div>
      )}

      {/* Official Printable Transcript Card */}
      <div className="print-container bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 space-y-8">
        {/* Institutional Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                VVITU Portal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Office of the Controller of Examinations · Statement of Marks
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-medium text-gray-900">
              {EXAM_TYPE_LABELS[examType]}
            </p>
            <p className="text-xs font-mono text-gray-500 mt-0.5">
              {activeAcademicYear}
            </p>
          </div>
        </div>

        {/* Student Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Student Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {studentRecord.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Roll Number</p>
            <p className="text-sm font-mono font-semibold text-indigo-600 mt-1">
              {studentRecord.rollNo}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Program & Batch</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {studentClass?.name ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {studentClass?.department ?? 'Computer Science & Engg.'}
            </p>
          </div>
        </div>

        {/* Subject Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 px-4">Subject Title</th>
                <th className="pb-3 px-4 text-right">Max</th>
                <th className="pb-3 px-4 text-right">Pass</th>
                <th className="pb-3 px-4 text-right">Obtained</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {summary.subjectDetails.map((detail) => (
                <tr key={detail.subject.id} className="h-14">
                  <td className="pr-4 font-mono text-xs font-medium text-indigo-600">
                    {detail.subject.subjectCode}
                  </td>
                  <td className="px-4 font-medium text-gray-900">
                    {detail.subject.subjectName}
                  </td>
                  <td className="px-4 text-right font-mono tabular-nums text-gray-500">
                    {detail.subject.maxMarks}
                  </td>
                  <td className="px-4 text-right font-mono tabular-nums text-gray-500">
                    {detail.subject.passMarks}
                  </td>
                  <td className="px-4 text-right font-mono tabular-nums font-semibold text-gray-900">
                    {detail.marksObtained !== null ? detail.marksObtained : '—'}
                  </td>
                  <td className="pl-4 text-right">
                    {detail.marksObtained === null ? (
                      <StatusBadge variant="pending" label="Awaiting" />
                    ) : detail.passed ? (
                      <StatusBadge variant="pass" />
                    ) : (
                      <StatusBadge variant="fail" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clean Aligned Summary Strip */}
        <div className="pt-8 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
          <div>
            <p className="text-xs text-gray-400">Grand Total</p>
            <p className="text-2xl font-semibold font-mono tabular-nums text-gray-900 mt-1">
              {summary.evaluatedSubjectsCount > 0
                ? `${summary.totalObtained} / ${summary.totalMax}`
                : '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Percentage</p>
            <p className="text-2xl font-semibold font-mono tabular-nums text-gray-900 mt-1">
              {summary.evaluatedSubjectsCount > 0
                ? `${summary.percentage.toFixed(2)}%`
                : '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Grade</p>
            <p className="text-2xl font-semibold font-mono text-gray-900 mt-1">
              {summary.evaluatedSubjectsCount > 0 ? summary.grade : '—'}
              <span className="text-xs font-sans font-normal text-gray-500 ml-2">
                {summary.evaluatedSubjectsCount > 0 ? summary.gradeLabel : ''}
              </span>
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-gray-400 mb-1.5">Final Verdict</p>
            {summary.evaluatedSubjectsCount === 0 ? (
              <StatusBadge variant="pending" label="Pending" />
            ) : summary.overallPassed ? (
              <StatusBadge variant="pass" label="PASS" />
            ) : (
              <StatusBadge variant="fail" label="FAIL" />
            )}
          </div>
        </div>

        {/* Official Signature Blocks */}
        <div className="pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-800">Date of Issue</p>
            <p className="font-mono mt-1">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </p>
          </div>
          <div className="sm:text-center">
            <div className="h-8 border-b border-gray-200 w-44 sm:mx-auto" />
            <p className="font-medium text-gray-800 mt-2">
              Head of Department
            </p>
            <p className="text-[11px] text-gray-400">
              {studentClass?.department ?? 'Computer Science & Engineering'}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="h-8 border-b border-gray-200 w-44 sm:ml-auto" />
            <p className="font-medium text-gray-800 mt-2">
              Controller of Examinations
            </p>
            <p className="text-[11px] text-gray-400">
              VVITU Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
