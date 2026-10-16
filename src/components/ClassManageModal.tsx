import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  UserCheck, 
  UserX, 
  RotateCcw,
  Scissors,
  CheckSquare,
  Square,
  Users
} from 'lucide-react';
import { ClassRecord, StudentRecord } from '../types';
import { RosterImportModal } from './RosterImportModal';

interface ClassManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRecord[];
  activeClassId: string;
  students: StudentRecord[];
  onAddClass: (name: string, count: number) => void;
  onUpdateClass: (classId: string, name: string) => void;
  onDeleteClass: (classId: string) => void;
  onUpdateStudents: (classId: string, updatedStudents: StudentRecord[]) => void;
  onDeleteStudent?: (studentId: string) => void;
  onSetClassCount?: (classId: string, count: number) => void;
}

export const ClassManageModal: React.FC<ClassManageModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClassId,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onUpdateStudents,
  onDeleteStudent,
  onSetClassCount,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId);

  const [classNameInput, setClassNameInput] = useState(activeClass?.name || '');
  const [newClassName, setNewClassName] = useState('');
  const [newClassCount, setNewClassCount] = useState(30);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [targetCountInput, setTargetCountInput] = useState<number>(30);
  const [noticeMessage, setNoticeMessage] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmingDeleteClass, setIsConfirmingDeleteClass] = useState(false);

  // Multi-select for batch delete
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Deleted history for quick 1-click in-modal undo
  const [recentlyDeletedStudents, setRecentlyDeletedStudents] = useState<StudentRecord[]>([]);

  // Local student state for editing
  const currentStudents = students
    .filter((s) => s.classId === activeClassId)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  const [localStudents, setLocalStudents] = useState<StudentRecord[]>(currentStudents);

  // Sync when activeClassId or students change
  useEffect(() => {
    if (activeClass) {
      setClassNameInput(activeClass.name);
      const sorted = students
        .filter((s) => s.classId === activeClassId)
        .sort((a, b) => a.seatNumber - b.seatNumber);
      setLocalStudents(sorted);
      setTargetCountInput(sorted.length || 30);
      setSelectedStudentIds(new Set());
      setIsConfirmingDeleteClass(false);
    }
  }, [activeClassId, activeClass, students]);

  if (!isOpen || !activeClass) return null;

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 3500);
  };

  const handleSaveClassName = () => {
    if (!classNameInput.trim()) return;
    onUpdateClass(activeClass.id, classNameInput.trim());
    showNotice('班級名稱已成功儲存');
  };

  const handleStudentNameChange = (studentId: string, name: string) => {
    const updated = localStudents.map((s) => (s.id === studentId ? { ...s, name } : s));
    setLocalStudents(updated);
    onUpdateStudents(activeClass.id, updated);
  };

  const handleToggleStudentActive = (studentId: string) => {
    const updated = localStudents.map((s) =>
      s.id === studentId ? { ...s, isActive: !s.isActive } : s
    );
    setLocalStudents(updated);
    onUpdateStudents(activeClass.id, updated);
    const target = updated.find((s) => s.id === studentId);
    showNotice(target?.isActive ? `座號 ${target.seatNumber} 號已恢復正常清點` : `座號 ${target?.seatNumber} 號已設為缺號 (不計入統計)`);
  };

  // Permanently delete a single seat number (Direct execution, no blocking window.confirm)
  const executeDeleteSeat = (studentId: string) => {
    const target = localStudents.find((s) => s.id === studentId);
    if (!target) return;

    const updated = localStudents.filter((s) => s.id !== studentId);
    setLocalStudents(updated);
    setRecentlyDeletedStudents((prev) => [target, ...prev]);

    if (onDeleteStudent) {
      onDeleteStudent(studentId);
    } else {
      onUpdateStudents(activeClass.id, updated);
    }

    // Deselect if selected
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });

    showNotice(`已成功刪除座號：${target.seatNumber} 號 ${target.name ? `(${target.name})` : ''}！`);
  };

  // Restore recently deleted student
  const handleUndoDeleteStudent = () => {
    if (recentlyDeletedStudents.length === 0) return;
    const [restored, ...remaining] = recentlyDeletedStudents;
    const updated = [...localStudents, restored].sort((a, b) => a.seatNumber - b.seatNumber);
    setLocalStudents(updated);
    onUpdateStudents(activeClass.id, updated);
    setRecentlyDeletedStudents(remaining);
    showNotice(`已復原座號：${restored.seatNumber} 號 ${restored.name ? `(${restored.name})` : ''}`);
  };

  // Batch delete selected seats
  const executeBatchDelete = () => {
    if (selectedStudentIds.size === 0) return;
    const toDeleteCount = selectedStudentIds.size;
    const deletedItems = localStudents.filter((s) => selectedStudentIds.has(s.id));
    const updated = localStudents.filter((s) => !selectedStudentIds.has(s.id));

    setLocalStudents(updated);
    setRecentlyDeletedStudents((prev) => [...deletedItems, ...prev]);
    setSelectedStudentIds(new Set());
    onUpdateStudents(activeClass.id, updated);

    showNotice(`已成功批次刪除 ${toDeleteCount} 個座號！`);
  };

  // Direct resize / trim class to targetCount
  const handleApplyCountResize = (newCount: number) => {
    if (newCount <= 0) return;

    if (onSetClassCount) {
      onSetClassCount(activeClass.id, newCount);
      setTargetCountInput(newCount);
      showNotice(`已將全班人數調整為 ${newCount} 人！`);
      return;
    }

    // Fallback: local resize
    if (newCount < localStudents.length) {
      const deletedItems = localStudents.slice(newCount);
      const kept = localStudents.slice(0, newCount);
      setLocalStudents(kept);
      setRecentlyDeletedStudents((prev) => [...deletedItems, ...prev]);
      onUpdateStudents(activeClass.id, kept);
      showNotice(`已成功裁切多餘座號，班級保留為 1～${newCount} 號！`);
    } else if (newCount > localStudents.length) {
      const maxSeat = localStudents.reduce((max, s) => Math.max(max, s.seatNumber), 0);
      const newItems: StudentRecord[] = [];
      for (let i = 1; i <= newCount - localStudents.length; i++) {
        const seatNum = maxSeat + i;
        newItems.push({
          id: `student_${activeClass.id}_${seatNum}_${Date.now()}_${i}`,
          classId: activeClass.id,
          seatNumber: seatNum,
          name: '',
          isActive: true,
        });
      }
      const updated = [...localStudents, ...newItems];
      setLocalStudents(updated);
      onUpdateStudents(activeClass.id, updated);
      showNotice(`已新增座號至 ${newCount} 號！`);
    }
    setTargetCountInput(newCount);
  };

  // Toggle select single student
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === localStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(localStudents.map((s) => s.id)));
    }
  };

  const handleQuickAddSeats = (countToAdd: number) => {
    const maxSeat = localStudents.reduce((max, s) => Math.max(max, s.seatNumber), 0);
    const newItems: StudentRecord[] = [];
    for (let i = 1; i <= countToAdd; i++) {
      const seatNum = maxSeat + i;
      newItems.push({
        id: `student_${activeClass.id}_${seatNum}_${Date.now()}_${i}`,
        classId: activeClass.id,
        seatNumber: seatNum,
        name: '',
        isActive: true,
      });
    }
    const updated = [...localStudents, ...newItems];
    setLocalStudents(updated);
    onUpdateStudents(activeClass.id, updated);
    showNotice(`已新增 ${countToAdd} 個座號（現共 ${updated.length} 人）`);
  };

  const handleApplyImportedRoster = (imported: StudentRecord[]) => {
    setLocalStudents(imported);
    onUpdateStudents(activeClass.id, imported);
    showNotice(`名單匯入成功！已更新為 ${imported.length} 位學生`);
  };

  const handleCreateNewClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName.trim(), Number(newClassCount) || 30);
    setNewClassName('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>班級與座號名單設定</span>
            </h2>
            <p className="text-xs text-slate-500">
              可直接設定班級人數、刪除多餘座號、標記缺號或匯入姓名
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Notice Feedback Banner */}
          {noticeMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{noticeMessage}</span>
              </div>
              {recentlyDeletedStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoDeleteStudent}
                  className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>復原剛才刪除</span>
                </button>
              )}
            </div>
          )}

          {/* Section 1: Class Name Edit */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              目前班級名稱
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder="例如：七年級 1 班"
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden font-medium"
              />
              <button
                type="button"
                onClick={handleSaveClassName}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                儲存名稱
              </button>
            </div>
          </div>

          {/* Section 2: ONE-CLICK CLASS SIZE & AUTO-TRIM (Solves "some classes don't have many people, need to delete excess seats") */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-3.5 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                <Scissors className="w-4 h-4 text-blue-600" />
                <span>快速調整全班人數（一鍵裁切多餘座號）</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                目前全班共 {localStudents.length} 號
              </span>
            </div>

            <p className="text-[11px] text-blue-700 mb-2.5 leading-relaxed">
              若班級人數較少（例如 25 人），點擊下方人數即可<strong>自動刪除多餘座號</strong>；若人數增加則自動擴充號碼。
            </p>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span className="text-[11px] font-medium text-slate-500 mr-0.5">常用班級人數：</span>
              {[15, 20, 24, 25, 28, 30, 32, 35].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleApplyCountResize(count)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    localStudents.length === count
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs ring-2 ring-blue-500/30'
                      : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {count} 人
                </button>
              ))}
            </div>

            {/* Custom Count Input */}
            <div className="flex items-center gap-2 pt-1 border-t border-blue-200/60">
              <span className="text-xs text-blue-900 font-medium">自訂人數：</span>
              <input
                type="number"
                min="1"
                max="80"
                value={targetCountInput}
                onChange={(e) => setTargetCountInput(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 text-center bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800"
              />
              <span className="text-xs text-blue-900">人</span>
              <button
                type="button"
                onClick={() => handleApplyCountResize(targetCountInput)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                ✂️ 套用人數
              </button>
            </div>
          </div>

          {/* Section 3: Student Seat List Management */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  學生名單明細（共 {localStudents.length} 號）
                </span>
                <span className="text-[11px] text-slate-500">
                  有效清點：{localStudents.filter((s) => s.isActive).length} 人
                </span>
              </div>

              {/* Roster Import Trigger */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                📥 批次匯入名單 (CSV/貼上)
              </button>
            </div>

            {/* Action Bar: Select All / Batch Delete / Add Seats */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {selectedStudentIds.size === localStudents.length && localStudents.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>全選 ({selectedStudentIds.size}/{localStudents.length})</span>
                </button>

                {selectedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={executeBatchDelete}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs animate-in fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>刪除所選 {selectedStudentIds.size} 個座號</span>
                  </button>
                )}
              </div>

              {/* Add seats */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAddSeats(1)}
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                >
                  + 加 1 號
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddSeats(5)}
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 cursor-pointer"
                >
                  + 加 5 號
                </button>
              </div>
            </div>

            {/* Student Seat Rows */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
              {localStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>目前班級沒有任何座號</p>
                  <p className="text-xs mt-1">請點擊上方按鈕新增座號，或使用「批次匯入名單」。</p>
                </div>
              ) : (
                localStudents.map((student) => {
                  const isChecked = selectedStudentIds.has(student.id);

                  return (
                    <div
                      key={student.id}
                      className={`p-2 flex items-center justify-between gap-2 text-xs transition-colors ${
                        isChecked
                          ? 'bg-rose-50/60'
                          : student.isActive
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-slate-100/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelectStudent(student.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label={`選取 ${student.seatNumber} 號`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        {/* Seat Number Badge */}
                        <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-800 shrink-0">
                          {student.seatNumber}
                        </span>

                        {/* Student Name Input */}
                        <input
                          type="text"
                          placeholder="姓名 (選填，如: 王小明)"
                          value={student.name || ''}
                          onChange={(e) => handleStudentNameChange(student.id, e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md w-28 sm:w-44 focus:outline-hidden focus:border-blue-500 bg-white font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Active toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStudentActive(student.id)}
                          title={student.isActive ? '標記為缺號/轉出 (不列入統計)' : '恢復此座號'}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            student.isActive
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          {student.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span className="hidden xs:inline">正常</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-amber-600" />
                              <span className="hidden xs:inline">缺號</span>
                            </>
                          )}
                        </button>

                        {/* Prominent Direct Delete Button (Foolproof & Immediate) */}
                        <button
                          type="button"
                          onClick={() => executeDeleteSeat(student.id)}
                          title={`刪除 ${student.seatNumber} 號`}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * 提示：點擊任何座號旁的紅色「刪除」按鈕即可直接刪除；若要縮減整班，點擊上方常用人數（如 25人）最為快速。
            </p>
          </div>

          {/* Section 4: Add new class */}
          <div className="pt-2 border-t border-slate-200">
            {!isCreatingNew ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增其他班級
                </button>

                {classes.length > 1 && (
                  isConfirmingDeleteClass ? (
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded px-2 py-1 animate-in fade-in">
                      <span className="text-rose-700 font-bold text-xs">確定刪除整班？</span>
                      <button
                        type="button"
                        onClick={() => onDeleteClass(activeClass.id)}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-xs hover:bg-rose-700 cursor-pointer"
                      >
                        確認刪除
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDeleteClass(false)}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDeleteClass(true)}
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      刪除目前班級
                    </button>
                  )
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateNewClassSubmit} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  新增全新班級
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="例如：八年級 3 班"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    placeholder="預設人數 (如 30)"
                    value={newClassCount}
                    onChange={(e) => setNewClassCount(Number(e.target.value))}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    確認新增班級
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            名單隨點隨存，已自動儲存至本機
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            完成設定並關閉
          </button>
        </div>
      </div>

      {/* Roster Import Submodal */}
      <RosterImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeClass={activeClass}
        onApplyRoster={handleApplyImportedRoster}
      />
    </div>
  );
};
