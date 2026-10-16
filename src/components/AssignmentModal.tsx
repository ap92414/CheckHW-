import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { AssignmentRecord } from '../types';
import { getTodayDateString } from '../utils/storage';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentToEdit?: AssignmentRecord | null;
  onSaveAssignment: (title: string, date: string, id?: string) => void;
}

const TEMPLATE_TITLES = [
  '數學講義 隨堂練習',
  '國文習作 第五課 (全)',
  '英文文法講義 Unit 4',
  '理化活動紀錄簿',
  '聯絡簿 / 札記查閱',
  '社會科學習單',
  '生物實驗預習作業',
];

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignmentToEdit,
  onSaveAssignment,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setDate(assignmentToEdit.date);
    } else {
      setTitle('');
      setDate(getTodayDateString());
    }
  }, [assignmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSaveAssignment(title.trim(), date, assignmentToEdit?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>{assignmentToEdit ? '編輯作業資訊' : '新增清點作業'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              作業名稱 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="例如：數學習作 2-3、國文隨堂講義"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              作業日期
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Quick template title pills */}
          {!assignmentToEdit && (
            <div>
              <span className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                常用作業名稱快捷填寫：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
            >
              {assignmentToEdit ? '儲存修改' : '立即新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
