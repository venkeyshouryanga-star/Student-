import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  School,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { useMarks } from '../context/MarksContext';

export function AdminDashboard() {
  const { state, navigate, activeAcademicYear } = useMarks();

  const publishedStats = useMemo(() => {
    const semesterMarks = state.marks.filter((m) => m.examType === 'SEMESTER_END');
    const totalExpected = state.students.length * state.subjects.length;
    const publishedCount = semesterMarks.filter(
      (m) => m.status === 'PUBLISHED'
    ).length;
    const pct =
      totalExpected > 0
        ? ((publishedCount / totalExpected) * 100).toFixed(1)
        : '0.0';
    return { totalExpected, publishedCount, pct };
  }, [state.marks, state.students.length, state.subjects.length]);

  const kpis = [
    {
      label: 'Total Students',
      value: state.students.length,
      detail: `${state.classes.length} active batches`,
      icon: <Users className="w-4 h-4 text-indigo-600" />,
      route: 'admin-students' as const,
    },
    {
      label: 'Active Classes',
      value: state.classes.length,
      detail: activeAcademicYear,
      icon: <School className="w-4 h-4 text-indigo-600" />,
      route: 'admin-academics' as const,
    },
    {
      label: 'Subjects Configured',
      value: state.subjects.length,
      detail: `${state.assignments.length} faculty mappings`,
      icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
      route: 'admin-academics' as const,
    },
    {
      label: 'Published Results',
      value: `${publishedStats.pct}%`,
      detail: `${publishedStats.publishedCount} of ${publishedStats.totalExpected} entries`,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      route: 'admin-backup' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with ONE Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Academic batches, subject configurations, student directory, and result status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('admin-students')}
          className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Manage Students
        </button>
      </div>

      {/* 4 Clean Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => navigate(kpi.route)}
            className="text-left bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {kpi.label}
              </span>
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                {kpi.icon}
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold font-mono tabular-nums text-gray-900">
              {kpi.value}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span className="truncate">{kpi.detail}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600 transition-colors shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Two-Column Airy Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Classes Table */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Active Classes
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Enrollment & Semester End publication progress
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('admin-academics')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              Configure
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Class Name</th>
                  <th className="pb-3 px-4">Code</th>
                  <th className="pb-3 px-4 text-right">Students</th>
                  <th className="pb-3 pl-4 text-right">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {state.classes.map((cls) => {
                  const classStudents = state.students.filter(
                    (s) => s.classId === cls.id
                  );
                  const expected = classStudents.length * state.subjects.length;
                  const published = state.marks.filter(
                    (m) =>
                      m.classId === cls.id &&
                      m.examType === 'SEMESTER_END' &&
                      m.status === 'PUBLISHED'
                  ).length;
                  const pct =
                    expected > 0 ? Math.round((published / expected) * 100) : 0;

                  return (
                    <tr key={cls.id} className="h-14">
                      <td className="pr-4 font-medium text-gray-900">
                        {cls.name}
                      </td>
                      <td className="px-4 font-mono text-xs text-gray-500">
                        {cls.code}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-gray-700">
                        {classStudents.length}
                      </td>
                      <td className="pl-4 text-right font-mono tabular-nums">
                        <span className="font-medium text-gray-900">
                          {published}/{expected}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({pct}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Faculty Allocation Summary */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Faculty Allocation
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Assigned course pairs
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('admin-assignments')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              Edit Mapping
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {state.users
              .filter((u) => u.role === 'TEACHER')
              .map((teacher) => {
                const count = state.assignments.filter(
                  (a) => a.teacherId === teacher.id
                ).length;
                return (
                  <div
                    key={teacher.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {teacher.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {teacher.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-semibold font-mono tabular-nums text-gray-900">
                        {count}
                      </span>
                      <p className="text-[11px] text-gray-400">courses</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
