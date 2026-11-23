import { useMemo, useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { useMarks } from '../context/MarksContext';
import { ExamType } from '../types';
import {
  computeStudentExamSummary,
  computeSubjectAnalytics,
  EXAM_TYPE_LABELS,
} from '../utils/calculations';

export function HodAnalytics() {
  const { state, navigate } = useMarks();
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [examType, setExamType] = useState<ExamType>('SEMESTER_END');

  const scopedStudents = useMemo(() => {
    return selectedClassId === 'ALL'
      ? state.students
      : state.students.filter((s) => s.classId === selectedClassId);
  }, [state.students, selectedClassId]);

  const subjectAnalyticsList = useMemo(() => {
    return state.subjects.map((subj) =>
      computeSubjectAnalytics(scopedStudents, subj, state.marks, examType)
    );
  }, [state.subjects, scopedStudents, state.marks, examType]);

  const classDistributions = useMemo(() => {
    const targetClasses =
      selectedClassId === 'ALL'
        ? state.classes
        : state.classes.filter((c) => c.id === selectedClassId);

    return targetClasses.map((cls) => {
      const clsStudents = state.students.filter((s) => s.classId === cls.id);
      const summaries = clsStudents.map((stu) =>
        computeStudentExamSummary(stu, state.subjects, state.marks, examType, {
          academicClass: cls,
        })
      );
      const evaluated = summaries.filter((s) => s.evaluatedSubjectsCount > 0);
      const passCount = evaluated.filter((s) => s.overallPassed).length;
      const failCount = evaluated.filter((s) => !s.overallPassed).length;
      const avgPct =
        evaluated.length > 0
          ? (
              evaluated.reduce((acc, s) => acc + s.percentage, 0) /
              evaluated.length
            ).toFixed(2)
          : '0.00';

      return {
        cls,
        totalStudents: clsStudents.length,
        evaluatedCount: evaluated.length,
        passCount,
        failCount,
        avgPct,
      };
    });
  }, [
    state.classes,
    state.students,
    state.subjects,
    state.marks,
    selectedClassId,
    examType,
  ]);

  const missingAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      className: string;
      subjectCode: string;
      subjectName: string;
      studentRoll: string;
      studentName: string;
      teacherName: string;
      issue: 'NOT_ENTERED' | 'DRAFT';
      marksObtained?: number;
    }> = [];

    for (const stu of scopedStudents) {
      const cls = state.classes.find((c) => c.id === stu.classId);
      for (const subj of state.subjects) {
        const rec = state.marks.find(
          (m) =>
            m.studentId === stu.id &&
            m.subjectId === subj.id &&
            m.examType === examType
        );
        if (!rec || rec.status === 'DRAFT') {
          const assignment = state.assignments.find(
            (a) => a.classId === stu.classId && a.subjectId === subj.id
          );
          const teacher = assignment
            ? state.users.find((u) => u.id === assignment.teacherId)
            : null;
          alerts.push({
            id: `${stu.id}-${subj.id}`,
            className: cls?.name ?? 'Unknown',
            subjectCode: subj.subjectCode,
            subjectName: subj.subjectName,
            studentRoll: stu.rollNo,
            studentName: stu.name,
            teacherName: teacher?.name ?? 'Unassigned',
            issue: rec ? 'DRAFT' : 'NOT_ENTERED',
            marksObtained: rec?.marksObtained,
          });
        }
      }
    }
    return alerts;
  }, [
    scopedStudents,
    state.classes,
    state.subjects,
    state.marks,
    state.assignments,
    state.users,
    examType,
  ]);

  const overallMetrics = useMemo(() => {
    const totalExpected = scopedStudents.length * state.subjects.length;
    let publishedCount = 0;
    let totalMarksPctSum = 0;
    let subjectPctCount = 0;
    for (const sa of subjectAnalyticsList) {
      publishedCount += sa.publishedCount;
      if (sa.enteredCount > 0) {
        totalMarksPctSum += sa.averagePercentage;
        subjectPctCount++;
      }
    }
    const pubRate =
      totalExpected > 0
        ? ((publishedCount / totalExpected) * 100).toFixed(1)
        : '0.0';
    const avgScore =
      subjectPctCount > 0
        ? (totalMarksPctSum / subjectPctCount).toFixed(2)
        : '0.00';
    return { totalExpected, publishedCount, pubRate, avgScore };
  }, [scopedStudents.length, state.subjects.length, subjectAnalyticsList]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Department Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pass/fail distributions, class averages, and missing mark alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('hod-reports')}
          className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Open Master Ledger
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter by Class"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Department Classes</option>
          {state.classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Exam"
          value={examType}
          onChange={(e) => setExamType(e.target.value as ExamType)}
          className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {(Object.keys(EXAM_TYPE_LABELS) as ExamType[]).map((key) => (
            <option key={key} value={key}>
              {EXAM_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {/* 4 Clean Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-medium text-gray-500">Scoped Students</p>
          <p className="mt-3 text-3xl font-semibold font-mono tabular-nums text-gray-900">
            {scopedStudents.length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-medium text-gray-500">Department Average</p>
          <p className="mt-3 text-3xl font-semibold font-mono tabular-nums text-gray-900">
            {overallMetrics.avgScore}%
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-medium text-gray-500">Published Coverage</p>
          <p className="mt-3 text-3xl font-semibold font-mono tabular-nums text-emerald-700">
            {overallMetrics.pubRate}%
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-medium text-gray-500">Pending Alerts</p>
          <p
            className={`mt-3 text-3xl font-semibold font-mono tabular-nums ${
              missingAlerts.length > 0 ? 'text-amber-600' : 'text-emerald-700'
            }`}
          >
            {missingAlerts.length}
          </p>
        </div>
      </div>

      {/* Subject & Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <h2 className="text-base font-semibold text-gray-900">
            Subject Pass / Fail Distribution
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 mb-6">
            Pass, fail, and pending breakdown across {scopedStudents.length} students
          </p>

          <div className="space-y-5">
            {subjectAnalyticsList.map((item) => {
              const total = item.totalStudents || 1;
              const passW = (item.passCount / total) * 100;
              const failW = (item.failCount / total) * 100;
              const pendW = (item.pendingCount / total) * 100;

              return (
                <div key={item.subject.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono font-medium text-indigo-600 mr-2">
                        {item.subject.subjectCode}
                      </span>
                      <span className="font-medium text-gray-900">
                        {item.subject.subjectName}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums text-gray-500 shrink-0">
                      <span className="text-gray-900 font-medium">
                        {item.enteredCount > 0 ? `${item.averagePercentage}%` : '—'}
                      </span>{' '}
                      · <span className="text-emerald-700">{item.passCount}P</span> /{' '}
                      <span className="text-rose-600">{item.failCount}F</span> /{' '}
                      <span>{item.pendingCount} Pend</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    {passW > 0 && (
                      <div
                        style={{ width: `${passW}%` }}
                        className="bg-emerald-500 h-full"
                      />
                    )}
                    {failW > 0 && (
                      <div
                        style={{ width: `${failW}%` }}
                        className="bg-rose-500 h-full"
                      />
                    )}
                    {pendW > 0 && (
                      <div
                        style={{ width: `${pendW}%` }}
                        className="bg-gray-200 h-full"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <h2 className="text-base font-semibold text-gray-900">
            Batch Performance
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 mb-6">
            Pass rate and average score per class
          </p>

          <div className="divide-y divide-gray-100">
            {classDistributions.map((item) => {
              const passPct =
                item.evaluatedCount > 0
                  ? Math.round((item.passCount / item.evaluatedCount) * 100)
                  : 0;
              return (
                <div
                  key={item.cls.id}
                  className="py-5 first:pt-0 last:pb-0 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.cls.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.totalStudents} students · {passPct}% passed
                      </p>
                    </div>
                    <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">
                      {item.avgPct}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${passPct}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${100 - passPct}%` }}
                      className="bg-rose-400 h-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missing Marks Alert Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Missing & Unpublished Marks ({missingAlerts.length})
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Records awaiting faculty entry or publication
          </p>
        </div>

        {missingAlerts.length === 0 ? (
          <p className="py-6 text-sm text-emerald-700 font-medium">
            All marks for the selected scope are entered and published.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Class</th>
                  <th className="pb-3 px-4">Subject</th>
                  <th className="pb-3 px-4">Roll No</th>
                  <th className="pb-3 px-4">Student</th>
                  <th className="pb-3 px-4">Assigned Faculty</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {missingAlerts.map((alert) => (
                  <tr key={alert.id} className="h-14">
                    <td className="pr-4 text-gray-600">{alert.className}</td>
                    <td className="px-4">
                      <span className="font-mono text-xs text-indigo-600 mr-2">
                        {alert.subjectCode}
                      </span>
                      <span className="text-gray-900">{alert.subjectName}</span>
                    </td>
                    <td className="px-4 font-mono text-xs text-gray-600">
                      {alert.studentRoll}
                    </td>
                    <td className="px-4 font-medium text-gray-900">
                      {alert.studentName}
                    </td>
                    <td className="px-4 text-gray-500">{alert.teacherName}</td>
                    <td className="pl-4 text-right">
                      {alert.issue === 'DRAFT' ? (
                        <StatusBadge
                          variant="draft"
                          label={`Draft (${alert.marksObtained})`}
                        />
                      ) : (
                        <StatusBadge variant="pending" label="Not Entered" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
