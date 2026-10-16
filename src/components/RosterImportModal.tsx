import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';
import { StudentRecord, ClassRecord } from '../types';

interface RosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassRecord;
  onApplyRoster: (importedStudents: StudentRecord[]) => void;
}

interface ParsedStudent {
  seatNumber: number;
  name: string;
}

export const RosterImportModal: React.FC<RosterImportModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  onApplyRoster,
}) => {
  const [importText, setImportText] = useState('');
  const [parsedList, setParsedList] = useState<ParsedStudent[]>([]);
  const [parseError, setParseError] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'update-names-only'>('replace');

  if (!isOpen) return null;

  // Auto-parse on text input change
  const handleTextChange = (text: string) => {
    setImportText(text);
    setParseError('');

    if (!text.trim()) {
      setParsedList([]);
      return;
    }

    try {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const list: ParsedStudent[] = [];
      const seenSeats = new Set<number>();

      lines.forEach((line, index) => {
        // Strip out common separators like comma, tab, multiple spaces
        // Format A: "1 王小明" or "1. 王小明" or "1、王小明" or "1,王小明" or "1\t王小明"
        // Format B: Just "王小明" (auto-assign index + 1)
        const matchWithNumber = line.match(/^(\d+)[\s.,、\t,]+(.+)$/);
        
        let seatNum = index + 1;
        let name = line;

        if (matchWithNumber) {
          seatNum = parseInt(matchWithNumber[1], 10);
          name = matchWithNumber[2].trim();
        } else {
          // If the line is just a number, skip or treat as seat with no name
          if (/^\d+$/.test(line)) {
            seatNum = parseInt(line, 10);
            name = '';
          }
        }

        // Handle duplicates
        if (seenSeats.has(seatNum)) {
          seatNum = Math.max(...Array.from(seenSeats)) + 1;
        }
        seenSeats.add(seatNum);

        list.push({
          seatNumber: seatNum,
          name,
        });
      });

      // Sort strictly by seat number
      list.sort((a, b) => a.seatNumber - b.seatNumber);
      setParsedList(list);
    } catch (err) {
      setParseError('解析名單格式時發生錯誤，請檢查內容');
    }
  };

  // CSV file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApply = () => {
    if (parsedList.length === 0) return;

    const newStudents: StudentRecord[] = parsedList.map((p) => ({
      id: `student_${activeClass.id}_${p.seatNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      classId: activeClass.id,
      seatNumber: p.seatNumber,
      name: p.name,
      isActive: true,
    }));

    onApplyRoster(newStudents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>批次匯入學生名單</span>
            </h2>
            <p className="text-xs text-slate-500">
              將名單匯入至【{activeClass.name}】，自動依人數建立座號，多餘號碼不會產生
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Instructions & File Upload */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900">
            <div>
              <div className="font-semibold text-xs">支援從校務系統複製或上傳 CSV</div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                可貼上格式如：<code>1 王小明</code> 或每行一個姓名，將自動由 1 號開始排號。
              </div>
            </div>

            <label className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100/60 text-blue-800 font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>上傳 CSV/TXT 檔案</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Paste Textarea */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              在此直接貼上名單文字：
            </label>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`範例格式 1 (座號+姓名)：\n1 王小明\n2 李小美\n3 陳大華\n\n範例格式 2 (純姓名，自動編號 1 號起)：\n王小明\n李小美\n陳大華`}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Parsing Preview */}
          {parsedList.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  已成功辨識 {parsedList.length} 位學生
                </span>
                <span className="text-[11px] text-slate-500">
                  將設定班級座號為 1 ～ {parsedList[parsedList.length - 1].seatNumber} 號
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 p-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5">
                  {parsedList.map((p) => (
                    <div
                      key={p.seatNumber}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2"
                    >
                      <span className="w-5 h-5 bg-white border border-slate-300 rounded text-center font-bold text-[11px] text-slate-700 flex items-center justify-center">
                        {p.seatNumber}
                      </span>
                      <span className="truncate font-medium text-slate-800 text-xs">
                        {p.name || '(未提供姓名)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 text-[11px] leading-relaxed">
            💡 <strong>匯入後自動精簡人數：</strong> 匯入後班級人數將精確調整為這 {parsedList.length || 0} 位學生，原先多餘的未指派座號將會被清除，讓畫面乾淨俐落！
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {parsedList.length > 0 ? `即將匯入 ${parsedList.length} 人` : '請貼上或上傳名單'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              取消
            </button>
            <button
              disabled={parsedList.length === 0}
              onClick={handleApply}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors ${
                parsedList.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              確認匯入並套用名單
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
