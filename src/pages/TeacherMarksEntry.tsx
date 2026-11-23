import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Save,
  Search,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { useMarks } from '../context/MarksContext';
import { ExamType } from '../types';
import { EXAM_TYPE_LABELS } from '../utils/calculations';

function validateMarkInput(raw: string, maxMarks: number): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 'Enter a valid numeric value';
  }
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    return 'Invalid number';
  }
  if (num < 0) {
    return 'Cannot be negative (< 0)';
  }
  if (num > maxMarks) {
    return `Exceeds max marks (${maxMarks})`;
  }
  return null;
}

export function TeacherMarksEntry() {
  const {
    state,
    currentUser,
    preselectedGrid,
    setPreselectedGrid,
    saveBatchMarks,
    togglePublishStatus,
    rollSearchQuery,
    setRollSearchQuery,
  } = useMarks();

  const myAssignments = useMemo(() => {
    if (!currentUser) return [];
    return state.assignments.filter((a) => a.teacherId === currentUser.id);
  }, [state.assignments, currentUser]);

  const assignedClasses = useMemo(() => {
    const classIds = new Set(myAssignments.map((a) => a.classId));
    return state.classes.filter((c) => classIds.has(c.id));
  }, [myAssignments, state.classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => preselectedGrid?.classId ?? assignedClasses[0]?.id ?? ''
  );

  const assignedSubjectsForClass = useMemo(() => {
    const subjectIds = new Set(
      myAssignments
        .filter((a) => a.classId === selectedClassId)
        .map((a) => a.subjectId)
    );
    return state.subjects.filter((s) => subjectIds.has(s.id));
  }, [myAssignments, selectedClassId, state.subjects]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => preselectedGrid?.subjectId ?? assignedSubjectsForClass[0]?.id ?? ''
  );

  const [examType, setExamType] = useState<ExamType>('SEMESTER_END');

  useEffect(() => {
    if (preselectedGrid) {
      setSelectedClassId(preselectedGrid.classId);
      setSelectedSubjectId(preselectedGrid.subjectId);
      setPreselectedGrid(null);
    }
  }, [preselectedGrid, setPreselectedGrid]);

  useEffect(() => {
    if (
      assignedClasses.length > 0 &&
      !assignedClasses.some((c) => c.id === selectedClassId)
    ) {
      setSelectedClassId(assignedClasses[0].id);
    }
  }, [assignedClasses, selectedClassId]);

  useEffect(() => {
    if (
      assignedSubjectsForClass.length > 0 &&
      !assignedSubjectsForClass.some((s) => s.id === selectedSubjectId)
    ) {
      setSelectedSubjectId(assignedSubjectsForClass[0].id);
    }
  }, [assignedSubjectsForClass, selectedSubjectId]);

  const activeSubject = useMemo(
    () => state.subjects.find((s) => s.id === selectedSubjectId) ?? null,
    [state.subjects, selectedSubjectId]
  );

  const classStudents = useMemo(() => {
    const q = rollSearchQuery.trim().toLowerCase();
    return state.students
      .filter((s) => s.classId === selectedClassId)
      .filter(
        (s) =>
          !q ||
          s.rollNo.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
  }, [state.students, selectedClassId, rollSearchQuery]);

  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const stu of state.students.filter((s) => s.classId === selectedClassId)) {
      const existing = state.marks.find(
        (m) =>
          m.studentId === stu.id &&
          m.classId === selectedClassId &&
          m.subjectId === selectedSubjectId &&
          m.examType === examType
      );
      initial[stu.id] = existing ? String(existing.marksObtained) : '';
    }
    setDraftValues(initial);
  }, [selectedClassId, selectedSubjectId, examType, state.marks, state.students]);

  const cellErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!activeSubject) return errors;
    for (const stu of classStudents) {
      const val = draftValues[stu.id] ?? '';
      const err = validateMarkInput(val, activeSubject.maxMarks);
      if (err) errors[stu.id] = err;
    }
    return errors;
  }, [classStudents, draftValues, activeSubject]);

  const hasValidationErrors = Object.keys(cellErrors).length > 0;

  const validEntriesToSave = useMemo(() => {
    if (!activeSubject || hasValidationErrors) return [];
    const list: Array<{ studentId: string; marksObtained: number }> = [];
    for (const stu of classStudents) {
      const raw = (draftValues[stu.id] ?? '').trim();
      if (raw !== '') {
        list.push({ studentId: stu.id, marksObtained: Number(raw) });
      }
    }
    return list;
  }, [activeSubject, hasValidationErrors, classStudents, draftValues]);

  const gridSummary = useMemo(() => {
    if (!activeSubject) {
      return {
        entered: 0,
        passed: 0,
        failed: 0,
        avgPct: '0.00',
        allPublished: false,
        anySaved: false,
      };
    }
    let sum = 0;
    let entered = 0;
    let passed = 0;
    let failed = 0;
    let savedPublished = 0;
    let savedTotal = 0;

    for (const stu of classStudents) {
      const raw = (draftValues[stu.id] ?? '').trim();
      const err = cellErrors[stu.id];
      if (raw !== '' && !err) {
        const num = Number(raw);
        entered++;
        sum += num;
        if (num >= activeSubject.passMarks) passed++;
        else failed++;
      }

      const rec = state.marks.find(
        (m) =>
          m.studentId === stu.id &&
          m.classId === selectedClassId &&
          m.subjectId === selectedSubjectId &&
          m.examType === examType
      );
      if (rec) {
        savedTotal++;
        if (rec.status === 'PUBLISHED') savedPublished++;
      }
    }

    const avgPct =
      entered > 0
        ? ((sum / (entered * activeSubject.maxMarks)) * 100).toFixed(2)
        : '0.00';

    return {
      entered,
      passed,
      failed,
      avgPct,
      allPublished: savedTotal > 0 && savedPublished === classStudents.length,
      anySaved: savedTotal > 0,
    };
  }, [
    activeSubject,
    classStudents,
    draftValues,
    cellErrors,
    state.marks,
    selectedClassId,
    selectedSubjectId,
    examType,
  ]);

  if (myAssignments.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="w-5 h-5" />}
        title="No Assigned Subjects"
        description="You do not have any Class & Subject assignments yet."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with ONE Primary Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Marks Entry Grid
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter student marks inline with automatic bounds validation and Draft/Publish control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {gridSummary.anySaved && (
            <button
              type="button"
              onClick={() =>
                togglePublishStatus(
                  selectedClassId,
                  selectedSubjectId,
                  examType,
                  gridSummary.allPublished ? 'DRAFT' : 'PUBLISHED'
                )
              }
              className="px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {gridSummary.allPublished ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Revert to Draft</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Publish Saved</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={hasValidationErrors || validEntriesToSave.length === 0}
            onClick={() =>
              saveBatchMarks(
                selectedClassId,
                selectedSubjectId,
                examType,
                validEntriesToSave,
                'DRAFT'
              )
            }
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Save className="w-4 h-4 text-amber-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={hasValidationErrors || validEntriesToSave.length === 0}
            onClick={() =>
              saveBatchMarks(
                selectedClassId,
                selectedSubjectId,
                examType,
                validEntriesToSave,
                'PUBLISHED'
              )
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {/* Clean Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="grid-class-select"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Class
          </label>
          <select
            id="grid-class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {assignedClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="grid-subject-select"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Subject
          </label>
          <select
            id="grid-subject-select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {assignedSubjectsForClass.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.subjectCode} — {sub.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="grid-exam-select"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Examination
          </label>
          <select
            id="grid-exam-select"
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {(Object.keys(EXAM_TYPE_LABELS) as ExamType[]).map((key) => (
              <option key={key} value={key}>
                {EXAM_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="grid-roll-search"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Filter Student
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="grid-roll-search"
              type="text"
              value={rollSearchQuery}
              onChange={(e) => setRollSearchQuery(e.target.value)}
              placeholder="Roll No or name..."
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* 3 Clean Summary Metrics */}
      {activeSubject && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-500">Marks Range</p>
            <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-gray-900">
              0 – {activeSubject.maxMarks}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Pass mark: {activeSubject.passMarks}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-500">Completion</p>
            <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-gray-900">
              {gridSummary.entered} / {classStudents.length}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {gridSummary.passed} pass · {gridSummary.failed} fail
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-500">Class Average</p>
            <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-indigo-600">
              {gridSummary.avgPct}%
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Live computed across entered rows
            </p>
          </div>
        </div>
      )}

      {/* Validation Alert Banner */}
      {hasValidationErrors && (
        <div
          role="alert"
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 text-rose-700 text-sm"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="font-medium">
            {Object.keys(cellErrors).length} cell(s) contain invalid marks. Fix
            highlighted cells (0 to {activeSubject?.maxMarks ?? 100}) to enable saving.
          </p>
        </div>
      )}

      {/* Spacious Entry Grid */}
      {classStudents.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-5 h-5" />}
          title="No students match your filter"
          description="Clear the student search or enroll students into this class."
        />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Roll Number</th>
                  <th className="pb-3 px-4">Student Name</th>
                  <th className="pb-3 px-4 w-52">
                    Marks (/ {activeSubject?.maxMarks ?? 100})
                  </th>
                  <th className="pb-3 px-4 text-right">Percentage</th>
                  <th className="pb-3 px-4">Verdict</th>
                  <th className="pb-3 pl-4 text-right">Saved State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {classStudents.map((stu) => {
                  const raw = draftValues[stu.id] ?? '';
                  const error = cellErrors[stu.id];
                  const trimmed = raw.trim();
                  const numericVal =
                    trimmed !== '' && !error ? Number(trimmed) : null;
                  const pct =
                    numericVal !== null && activeSubject
                      ? ((numericVal / activeSubject.maxMarks) * 100).toFixed(2)
                      : null;
                  const passed =
                    numericVal !== null && activeSubject
                      ? numericVal >= activeSubject.passMarks
                      : null;

                  const savedRec = state.marks.find(
                    (m) =>
                      m.studentId === stu.id &&
                      m.classId === selectedClassId &&
                      m.subjectId === selectedSubjectId &&
                      m.examType === examType
                  );

                  return (
                    <tr key={stu.id} className="h-16">
                      <td className="pr-4 font-mono text-xs font-medium text-indigo-600">
                        {stu.rollNo}
                      </td>
                      <td className="px-4 font-medium text-gray-900">
                        {stu.name}
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={raw}
                            onChange={(e) =>
                              setDraftValues((prev) => ({
                                ...prev,
                                [stu.id]: e.target.value,
                              }))
                            }
                            placeholder={`0 - ${activeSubject?.maxMarks ?? 100}`}
                            aria-label={`Marks for ${stu.name}`}
                            aria-invalid={Boolean(error)}
                            className={`w-full px-3.5 py-2 text-sm font-mono tabular-nums rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                              error
                                ? 'border-rose-400 bg-rose-50/60 text-rose-900 focus:ring-rose-500/20'
                                : 'border-gray-200 bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                          />
                          {error && (
                            <p className="mt-1 text-[11px] font-medium text-rose-600">
                              {error}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-gray-600">
                        {pct !== null ? `${pct}%` : '—'}
                      </td>
                      <td className="px-4">
                        {passed === true ? (
                          <StatusBadge variant="pass" />
                        ) : passed === false ? (
                          <StatusBadge variant="fail" />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="pl-4 text-right">
                        {savedRec ? (
                          savedRec.status === 'PUBLISHED' ? (
                            <StatusBadge variant="published" />
                          ) : (
                            <StatusBadge variant="draft" />
                          )
                        ) : (
                          <StatusBadge variant="pending" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
