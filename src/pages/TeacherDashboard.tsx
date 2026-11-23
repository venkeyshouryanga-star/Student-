import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { useMarks } from '../context/MarksContext';
import { computeSubjectAnalytics } from '../utils/calculations';

export function TeacherDashboard() {
  const { state, currentUser, navigate, setPreselectedGrid } = useMarks();

  const myAssignments = useMemo(() => {
    if (!currentUser) return [];
    return state.assignments
      .filter((a) => a.teacherId === currentUser.id)
      .map((asg) => {
        const academicClass = state.classes.find((c) => c.id === asg.classId);
        const subject = state.subjects.find((s) => s.id === asg.subjectId);
        const classStudents = state.students.filter(
          (s) => s.classId === asg.classId
        );
        const analytics = subject
          ? computeSubjectAnalytics(
              classStudents,
              subject,
              state.marks,
              'SEMESTER_END'
            )
          : null;
        return { asg, academicClass, subject, analytics };
      })
      .filter((item) => item.academicClass && item.subject && item.analytics);
  }, [state, currentUser]);

  const handleOpenGrid = (classId: string, subjectId: string) => {
    setPreselectedGrid({ classId, subjectId });
    navigate('teacher-marks');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Assigned Courses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select an assigned course to enter, validate, and publish marks.
          </p>
        </div>

        {myAssignments.length > 0 && (
          <button
            type="button"
            onClick={() =>
              handleOpenGrid(
                myAssignments[0].asg.classId,
                myAssignments[0].asg.subjectId
              )
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Open Marks Grid
          </button>
        )}
      </div>

      {myAssignments.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck className="w-5 h-5" />}
          title="No courses assigned yet"
          description="Ask an Administrator to assign you to a Class and Subject pair."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myAssignments.map(({ asg, academicClass, subject, analytics }) => {
            if (!academicClass || !subject || !analytics) return null;
            const allPublished =
              analytics.totalStudents > 0 &&
              analytics.publishedCount === analytics.totalStudents;
            const hasDraft = analytics.draftCount > 0;

            return (
              <div
                key={asg.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-200 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-indigo-600">
                        {subject.subjectCode} · {academicClass.code}
                      </p>
                      <h2 className="text-base font-semibold text-gray-900 mt-1.5 truncate">
                        {subject.subjectName}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {academicClass.name}
                      </p>
                    </div>
                    {allPublished ? (
                      <StatusBadge variant="published" />
                    ) : hasDraft ? (
                      <StatusBadge variant="draft" />
                    ) : (
                      <StatusBadge variant="pending" />
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-gray-400">Students</p>
                      <p className="text-base font-semibold font-mono tabular-nums text-gray-900 mt-0.5">
                        {analytics.totalStudents}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Published</p>
                      <p className="text-base font-semibold font-mono tabular-nums text-emerald-700 mt-0.5">
                        {analytics.publishedCount}/{analytics.totalStudents}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Class Avg</p>
                      <p className="text-base font-semibold font-mono tabular-nums text-gray-900 mt-0.5">
                        {analytics.enteredCount > 0
                          ? `${analytics.averagePercentage}%`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenGrid(academicClass.id, subject.id)}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-indigo-50 text-xs font-medium text-gray-700 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Enter Marks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
