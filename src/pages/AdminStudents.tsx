import { Edit3, Plus, Search, Trash2, Users, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { useMarks } from '../context/MarksContext';
import { Student } from '../types';

export function AdminStudents() {
  const {
    state,
    rollSearchQuery,
    setRollSearchQuery,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useMarks();

  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [classId, setClassId] = useState(state.classes[0]?.id ?? '');
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    const q = rollSearchQuery.trim().toLowerCase();
    return state.students.filter((stu) => {
      const matchesClass = classFilter === 'ALL' || stu.classId === classFilter;
      const matchesQuery =
        !q ||
        stu.rollNo.toLowerCase().includes(q) ||
        stu.name.toLowerCase().includes(q) ||
        stu.email.toLowerCase().includes(q);
      return matchesClass && matchesQuery;
    });
  }, [state.students, classFilter, rollSearchQuery]);

  const openNewStudent = () => {
    setEditingStudent(null);
    setRollNo('');
    setName('');
    setEmail('');
    setClassId(state.classes[0]?.id ?? '');
    setFormError('');
    setModalOpen(true);
  };

  const openEditStudent = (stu: Student) => {
    setEditingStudent(stu);
    setRollNo(stu.rollNo);
    setName(stu.name);
    setEmail(stu.email);
    setClassId(stu.classId);
    setFormError('');
    setModalOpen(true);
  };

  const duplicateRollWarning = useMemo(() => {
    const normalized = rollNo.trim().toUpperCase();
    if (!normalized) return '';
    const conflict = state.students.find(
      (s) =>
        s.rollNo.trim().toUpperCase() === normalized &&
        s.id !== editingStudent?.id
    );
    return conflict
      ? `Roll No "${normalized}" is already assigned to ${conflict.name}.`
      : '';
  }, [rollNo, state.students, editingStudent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!rollNo.trim() || !name.trim() || !email.trim() || !classId) {
      setFormError('All fields are required.');
      return;
    }

    const res = editingStudent
      ? updateStudent({
          ...editingStudent,
          rollNo: rollNo.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          classId,
        })
      : addStudent({
          rollNo: rollNo.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          classId,
        });

    if (!res.ok) {
      setFormError(res.error ?? 'Failed to save student.');
      return;
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Student Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Register and edit student accounts with unique Roll Number enforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewStudent}
          className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Clean Search & Class Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={rollSearchQuery}
            onChange={(e) => setRollSearchQuery(e.target.value)}
            placeholder="Search by Roll No or name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          aria-label="Filter by Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Classes ({state.students.length})</option>
          {state.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No students match your filter"
          description="Clear the search query or register a new student account."
          action={
            <button
              type="button"
              onClick={openNewStudent}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              Add Student
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Roll Number</th>
                  <th className="pb-3 px-4">Student Name</th>
                  <th className="pb-3 px-4">Class</th>
                  <th className="pb-3 px-4">Email</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredStudents.map((stu) => {
                  const cls = state.classes.find((c) => c.id === stu.classId);
                  return (
                    <tr key={stu.id} className="h-14">
                      <td className="pr-4 font-mono font-medium text-xs text-indigo-600">
                        {stu.rollNo}
                      </td>
                      <td className="px-4 font-medium text-gray-900">
                        {stu.name}
                      </td>
                      <td className="px-4 text-gray-600">
                        {cls?.name ?? 'Unassigned'}
                      </td>
                      <td className="px-4 text-gray-500 text-xs">{stu.email}</td>
                      <td className="pl-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditStudent(stu)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label={`Edit ${stu.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(stu)}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            aria-label={`Delete ${stu.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-900/10 max-w-md w-full p-7">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Register Student'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {(formError || duplicateRollWarning) && (
                <div className="text-xs font-medium text-rose-700 bg-rose-50 rounded-xl px-3.5 py-2.5">
                  {formError || duplicateRollWarning}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Roll Number (Unique)
                </label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="2025DAMBT11722"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono border rounded-xl focus:outline-none focus:ring-2 ${
                    duplicateRollWarning
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-500/20'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student full name"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  University Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@student.university.edu"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Class Assignment
                </label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {state.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200/70 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(duplicateRollWarning)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove Student Account"
        description={`Delete ${deleteTarget?.name} (${deleteTarget?.rollNo}) and all associated marks?`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteStudent(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
