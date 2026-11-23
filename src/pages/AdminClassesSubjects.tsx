import { Edit3, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useMarks } from '../context/MarksContext';
import { AcademicClass, Subject } from '../types';

export function AdminClassesSubjects() {
  const {
    state,
    activeAcademicYear,
    addClass,
    updateClass,
    deleteClass,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useMarks();

  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  // Class modal state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [clsName, setClsName] = useState('');
  const [clsCode, setClsCode] = useState('');
  const [clsSemester, setClsSemester] = useState('Semester III');
  const [clsDepartment, setClsDepartment] = useState(
    'Computer Science & Engineering'
  );

  // Subject modal state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subMaxMarks, setSubMaxMarks] = useState('100');
  const [subPassMarks, setSubPassMarks] = useState('40');
  const [subCredits, setSubCredits] = useState('4');
  const [subError, setSubError] = useState('');

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'class' | 'subject';
    id: string;
    label: string;
  } | null>(null);

  const openNewClass = () => {
    setEditingClass(null);
    setClsName('');
    setClsCode('');
    setClsSemester('Semester III');
    setClsDepartment('Computer Science & Engineering');
    setClassModalOpen(true);
  };

  const openEditClass = (cls: AcademicClass) => {
    setEditingClass(cls);
    setClsName(cls.name);
    setClsCode(cls.code);
    setClsSemester(cls.semester);
    setClsDepartment(cls.department);
    setClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsName.trim() || !clsCode.trim()) return;
    if (editingClass) {
      updateClass({
        ...editingClass,
        name: clsName.trim(),
        code: clsCode.trim().toUpperCase(),
        semester: clsSemester.trim(),
        department: clsDepartment.trim(),
      });
    } else {
      addClass({
        name: clsName.trim(),
        code: clsCode.trim().toUpperCase(),
        semester: clsSemester.trim(),
        academicYear: activeAcademicYear,
        department: clsDepartment.trim(),
      });
    }
    setClassModalOpen(false);
  };

  const openNewSubject = () => {
    setEditingSubject(null);
    setSubCode('');
    setSubName('');
    setSubMaxMarks('100');
    setSubPassMarks('40');
    setSubCredits('4');
    setSubError('');
    setSubjectModalOpen(true);
  };

  const openEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setSubCode(subj.subjectCode);
    setSubName(subj.subjectName);
    setSubMaxMarks(String(subj.maxMarks));
    setSubPassMarks(String(subj.passMarks));
    setSubCredits(String(subj.credits));
    setSubError('');
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const max = Number(subMaxMarks);
    const pass = Number(subPassMarks);
    const credits = Number(subCredits);

    if (Number.isNaN(max) || max <= 0) {
      setSubError('Max marks must be greater than 0.');
      return;
    }
    if (Number.isNaN(pass) || pass < 0 || pass > max) {
      setSubError(`Pass marks must be between 0 and ${max}.`);
      return;
    }
    if (Number.isNaN(credits) || credits < 1) {
      setSubError('Credits must be at least 1.');
      return;
    }

    const ok = editingSubject
      ? updateSubject({
          ...editingSubject,
          subjectCode: subCode.trim().toUpperCase(),
          subjectName: subName.trim(),
          maxMarks: max,
          passMarks: pass,
          credits,
        })
      : addSubject({
          subjectCode: subCode.trim().toUpperCase(),
          subjectName: subName.trim(),
          maxMarks: max,
          passMarks: pass,
          credits,
        });

    if (ok) {
      setSubjectModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Classes & Subjects
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure academic batches, subject codes, max marks, and pass thresholds.
          </p>
        </div>

        {activeTab === 'classes' ? (
          <button
            type="button"
            onClick={openNewClass}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openNewSubject}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        )}
      </div>

      {/* Minimal Segmented Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'classes'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Classes ({state.classes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'subjects'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Subjects ({state.subjects.length})
        </button>
      </div>

      {/* Classes Table */}
      {activeTab === 'classes' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Class Name</th>
                  <th className="pb-3 px-4">Code</th>
                  <th className="pb-3 px-4">Semester</th>
                  <th className="pb-3 px-4">Department</th>
                  <th className="pb-3 px-4 text-right">Students</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {state.classes.map((cls) => {
                  const studentCount = state.students.filter(
                    (s) => s.classId === cls.id
                  ).length;
                  return (
                    <tr key={cls.id} className="h-14">
                      <td className="pr-4 font-medium text-gray-900">
                        {cls.name}
                      </td>
                      <td className="px-4 font-mono text-xs text-indigo-600">
                        {cls.code}
                      </td>
                      <td className="px-4 text-gray-600">{cls.semester}</td>
                      <td className="px-4 text-gray-500">{cls.department}</td>
                      <td className="px-4 text-right font-mono tabular-nums text-gray-900">
                        {studentCount}
                      </td>
                      <td className="pl-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditClass(cls)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label={`Edit ${cls.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({
                                type: 'class',
                                id: cls.id,
                                label: cls.name,
                              })
                            }
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            aria-label={`Delete ${cls.name}`}
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

      {/* Subjects Table */}
      {activeTab === 'subjects' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Code</th>
                  <th className="pb-3 px-4">Subject Name</th>
                  <th className="pb-3 px-4 text-right">Max Marks</th>
                  <th className="pb-3 px-4 text-right">Pass Marks</th>
                  <th className="pb-3 px-4 text-right">Credits</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {state.subjects.map((subj) => (
                  <tr key={subj.id} className="h-14">
                    <td className="pr-4 font-mono font-medium text-xs text-indigo-600">
                      {subj.subjectCode}
                    </td>
                    <td className="px-4 font-medium text-gray-900">
                      {subj.subjectName}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-gray-900">
                      {subj.maxMarks}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-gray-600">
                      {subj.passMarks}
                    </td>
                    <td className="px-4 text-right font-mono tabular-nums text-gray-600">
                      {subj.credits}
                    </td>
                    <td className="pl-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditSubject(subj)}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          aria-label={`Edit ${subj.subjectName}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'subject',
                              id: subj.id,
                              label: `${subj.subjectCode} - ${subj.subjectName}`,
                            })
                          }
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label={`Delete ${subj.subjectName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {classModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-900/10 max-w-md w-full p-7">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add Class'}
              </h3>
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  value={clsName}
                  onChange={(e) => setClsName(e.target.value)}
                  placeholder="e.g. CSE (AI & ML) - Batch 22"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Class Code
                  </label>
                  <input
                    type="text"
                    required
                    value={clsCode}
                    onChange={(e) => setClsCode(e.target.value)}
                    placeholder="CSE-AIML-22"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Semester
                  </label>
                  <input
                    type="text"
                    required
                    value={clsSemester}
                    onChange={(e) => setClsSemester(e.target.value)}
                    placeholder="Semester III"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={clsDepartment}
                  onChange={(e) => setClsDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setClassModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200/70 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {subjectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-900/10 max-w-md w-full p-7">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setSubjectModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="mt-5 space-y-4">
              {subError && (
                <p className="text-xs font-medium text-rose-700 bg-rose-50 rounded-xl px-3.5 py-2.5">
                  {subError}
                </p>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="CS306"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="Computer Networks"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={subMaxMarks}
                    onChange={(e) => setSubMaxMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Pass Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={subPassMarks}
                    onChange={(e) => setSubPassMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={subCredits}
                    onChange={(e) => setSubCredits(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200/70 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title={`Remove ${confirmDelete?.type === 'class' ? 'Class' : 'Subject'}`}
        description={`Are you sure you want to delete "${confirmDelete?.label}"? Associated assignments and marks will also be removed.`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete?.type === 'class') deleteClass(confirmDelete.id);
          if (confirmDelete?.type === 'subject') deleteSubject(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
