import { Link2, Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { useMarks } from '../context/MarksContext';

export function AdminAssignments() {
  const { state, assignTeacher, removeAssignment } = useMarks();

  const teachers = useMemo(
    () => state.users.filter((u) => u.role === 'TEACHER'),
    [state.users]
  );

  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '');
  const [classId, setClassId] = useState(state.classes[0]?.id ?? '');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id ?? '');
  const [filterTeacher, setFilterTeacher] = useState('ALL');

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !classId || !subjectId) return;
    assignTeacher(teacherId, classId, subjectId);
  };

  const filteredAssignments = useMemo(() => {
    return state.assignments.filter(
      (a) => filterTeacher === 'ALL' || a.teacherId === filterTeacher
    );
  }, [state.assignments, filterTeacher]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Teacher Mapping
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign faculty examiners to specific Class and Subject pairs.
        </p>
      </div>

      {/* Assign Form */}
      <form
        onSubmit={handleAssign}
        className="bg-white border border-gray-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Faculty Member
          </label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Subject
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectCode} — {s.subjectName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Course</span>
        </button>
      </form>

      {/* Active Allocations */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Active Allocations ({filteredAssignments.length})
          </h2>
          <select
            aria-label="Filter by Faculty"
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Faculty</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {filteredAssignments.length === 0 ? (
          <EmptyState
            icon={<Link2 className="w-5 h-5" />}
            title="No assignments found"
            description="Select a faculty member, class, and subject above to create an allocation."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Faculty</th>
                  <th className="pb-3 px-4">Class</th>
                  <th className="pb-3 px-4">Code</th>
                  <th className="pb-3 px-4">Subject</th>
                  <th className="pb-3 pl-4 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAssignments.map((asg) => {
                  const teacher = teachers.find((t) => t.id === asg.teacherId);
                  const cls = state.classes.find((c) => c.id === asg.classId);
                  const subj = state.subjects.find((s) => s.id === asg.subjectId);
                  return (
                    <tr key={asg.id} className="h-14">
                      <td className="pr-4 font-medium text-gray-900">
                        {teacher?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 text-gray-600">
                        {cls?.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 font-mono text-xs text-indigo-600 font-medium">
                        {subj?.subjectCode ?? '-'}
                      </td>
                      <td className="px-4 text-gray-700">
                        {subj?.subjectName ?? 'Unknown'}
                      </td>
                      <td className="pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeAssignment(asg.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Remove assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
