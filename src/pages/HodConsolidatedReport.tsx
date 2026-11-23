import { Download, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { useMarks } from '../context/MarksContext';
import { ExamType } from '../types';
import {
  computeStudentExamSummary,
  EXAM_TYPE_LABELS,
  exportConsolidatedCSV,
} from '../utils/calculations';

export function HodConsolidatedReport() {
  const { state, rollSearchQuery, setRollSearchQuery, activeAcademicYear } = useMarks();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id ?? 'ALL'
  );
  const [examType, setExamType] = useState<ExamType>('SEMESTER_END');

  const activeClassObj = useMemo(
    () => state.classes.find((c) => c.id === selectedClassId),
    [state.classes, selectedClassId]
  );

  const summaries = useMemo(() => {
    const q = rollSearchQuery.trim().toLowerCase();
    return state.students
      .filter((s) => selectedClassId === 'ALL' || s.classId === selectedClassId)
      .filter(
        (s) =>
          !q ||
          s.rollNo.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      )
      .map((stu) => {
        const cls = state.classes.find((c) => c.id === stu.classId);
        return computeStudentExamSummary(stu, state.subjects, state.marks, examType, {
          academicClass: cls,
        });
      });
  }, [
    state.students,
    state.classes,
    state.subjects,
    state.marks,
    selectedClassId,
    examType,
    rollSearchQuery,
  ]);

  const handleExportCSV = () => {
    const label = activeClassObj?.name ?? 'All_Classes';
    exportConsolidatedCSV(summaries, state.subjects, label, examType);
  };

  return (
    <div className="space-y-8">
      {/* Header + Primary Action */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Consolidated Master Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Subject-wise scores, grand totals, percentages, grades, and pass/fail status.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={summaries.length === 0}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={summaries.length === 0}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={rollSearchQuery}
            onChange={(e) => setRollSearchQuery(e.target.value)}
            placeholder="Filter by Roll No or name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Classes</option>
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Exam"
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {(Object.keys(EXAM_TYPE_LABELS) as ExamType[]).map((k) => (
              <option key={k} value={k}>
                {EXAM_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print-only mb-4 border-b border-gray-200 pb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          VVITU Portal — Consolidated Class Marks Ledger
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Class: {activeClassObj?.name ?? 'All Classes'} · Exam:{' '}
          {EXAM_TYPE_LABELS[examType]} · Session: {activeAcademicYear}
        </p>
      </div>

      {/* Master Ledger Table */}
      <div className="print-container bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 font-medium text-gray-500">
                <th className="pb-3 pr-4">Roll No</th>
                <th className="pb-3 px-4">Student</th>
                {state.subjects.map((subj) => (
                  <th
                    key={subj.id}
                    className="pb-3 px-3 text-right whitespace-nowrap"
                    title={subj.subjectName}
                  >
                    <div className="font-mono text-indigo-600">{subj.subjectCode}</div>
                    <div className="text-[10px] font-normal text-gray-400">
                      /{subj.maxMarks}
                    </div>
                  </th>
                ))}
                <th className="pb-3 px-3 text-right">Total</th>
                <th className="pb-3 px-3 text-right">%</th>
                <th className="pb-3 px-3 text-center">Grade</th>
                <th className="pb-3 pl-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.length === 0 ? (
                <tr>
                  <td
                    colSpan={state.subjects.length + 6}
                    className="py-12 text-center text-gray-500 text-sm"
                  >
                    No student records match the current filter.
                  </td>
                </tr>
              ) : (
                summaries.map((sum) => (
                  <tr key={sum.student.id} className="h-14">
                    <td className="pr-4 font-mono font-medium text-indigo-600 whitespace-nowrap">
                      {sum.student.rollNo}
                    </td>
                    <td className="px-4 font-medium text-gray-900 whitespace-nowrap text-sm">
                      <div>{sum.student.name}</div>
                      {selectedClassId === 'ALL' && (
                        <div className="text-[11px] font-normal text-gray-400">
                          {sum.academicClass?.code}
                        </div>
                      )}
                    </td>

                    {sum.subjectDetails.map((detail) => (
                      <td
                        key={detail.subject.id}
                        className="px-3 text-right font-mono tabular-nums text-sm"
                      >
                        {detail.marksObtained === null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span
                            className={
                              detail.passed === false
                                ? 'text-rose-600 font-semibold'
                                : detail.status === 'DRAFT'
                                ? 'text-amber-600 font-medium'
                                : 'text-gray-900'
                            }
                            title={
                              detail.status === 'DRAFT'
                                ? 'Draft (Unpublished)'
                                : undefined
                            }
                          >
                            {detail.marksObtained}
                            {detail.status === 'DRAFT' ? '*' : ''}
                          </span>
                        )}
                      </td>
                    ))}

                    <td className="px-3 text-right font-mono tabular-nums font-medium text-gray-900 whitespace-nowrap text-sm">
                      {sum.totalObtained}/{sum.totalMax}
                    </td>
                    <td className="px-3 text-right font-mono tabular-nums font-medium text-gray-900 text-sm">
                      {sum.evaluatedSubjectsCount > 0
                        ? `${sum.percentage.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="px-3 text-center font-mono font-semibold text-gray-900 text-sm">
                      {sum.evaluatedSubjectsCount > 0 ? sum.grade : '—'}
                    </td>
                    <td className="pl-4 text-right">
                      {sum.evaluatedSubjectsCount === 0 ? (
                        <StatusBadge variant="pending" />
                      ) : sum.overallPassed ? (
                        <StatusBadge variant="pass" label="PASS" />
                      ) : (
                        <StatusBadge variant="fail" label="FAIL" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span>* Asterisk indicates unpublished Draft marks.</span>
          <span>
            {summaries.length} student(s) · {EXAM_TYPE_LABELS[examType]}
          </span>
        </div>
      </div>
    </div>
  );
}
