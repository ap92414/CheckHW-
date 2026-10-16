import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Archive, 
  Trash2, 
  Edit3, 
  MoreHorizontal, 
  CheckCheck, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { AssignmentRecord } from '../types';

interface AssignmentBarProps {
  assignments: AssignmentRecord[];
  activeAssignmentId: string;
  onSelectAssignment: (id: string) => void;
  onOpenCreateAssignment: () => void;
  onOpenEditAssignment: (assignment: AssignmentRecord) => void;
  onDeleteAssignment: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onBatchSetStatus: (status: 'completed' | 'pending') => void;
}

export const AssignmentBar: React.FC<AssignmentBarProps> = ({
  assignments,
  activeAssignmentId,
  onSelectAssignment,
  onOpenCreateAssignment,
  onOpenEditAssignment,
  onDeleteAssignment,
  onToggleArchive,
  onBatchSetStatus,
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const activeAssignments = assignments.filter((a) => !a.isArchived);
  const archivedAssignments = assignments.filter((a) => a.isArchived);

  const displayList = showArchived ? assignments : activeAssignments;
  const currentAssignment = assignments.find((a) => a.id === activeAssignmentId);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5">
        {/* Top line: Active assignment overview & Quick actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentAssignment ? currentAssignment.title : '尚無作業'}
              </h1>
              {currentAssignment && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {currentAssignment.date}
                  </span>
                  {currentAssignment.isArchived && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                      已封存
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Menu */}
          {currentAssignment && (
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <button
                onClick={() => onBatchSetStatus('completed')}
                title="快速將所有學生標記為已交"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全班已交
              </button>

              <button
                onClick={() => onBatchSetStatus('pending')}
                title="快速重設全班為未交"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                全班重設
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="作業動作選單"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenEditAssignment(currentAssignment);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        編輯作業名稱/日期
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onBatchSetStatus('completed');
                        }}
                        className="w-full sm:hidden text-left px-3 py-2 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        一鍵全班已交
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onBatchSetStatus('pending');
                        }}
                        className="w-full sm:hidden text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        一鍵全班重設未交
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onToggleArchive(currentAssignment.id);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-500" />
                        {currentAssignment.isArchived ? '解除封存作業' : '封存此作業'}
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      {isConfirmingDelete ? (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded mx-1 text-center">
                          <p className="text-[11px] font-bold text-rose-800 mb-1.5">確定刪除此作業？</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsConfirmingDelete(false);
                                setMenuOpen(false);
                                onDeleteAssignment(currentAssignment.id);
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              確認刪除
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingDelete(false)}
                              className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsConfirmingDelete(true);
                          }}
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          刪除此作業
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom line: Tab list of assignments */}
        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={onOpenCreateAssignment}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            新增作業
          </button>

          {displayList.map((asg) => {
            const isSelected = asg.id === activeAssignmentId;
            return (
              <button
                key={asg.id}
                onClick={() => onSelectAssignment(asg.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{asg.title}</span>
                {asg.isArchived && (
                  <span className="text-[10px] text-amber-500">📁</span>
                )}
              </button>
            );
          })}

          {archivedAssignments.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0 transition-colors ml-auto"
            >
              <Archive className="w-3 h-3" />
              <span>{showArchived ? '隱藏封存' : `已封存 (${archivedAssignments.length})`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
