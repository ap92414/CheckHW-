import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { AppData, ClassRecord, AssignmentRecord, StudentRecord, SubmissionStatus } from '../types';
import { exportAssignmentCSV } from '../utils/formatSummary';
import { validateImportData } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  activeClass?: ClassRecord;
  activeAssignment?: AssignmentRecord;
  onImportData: (data: AppData) => void;
  onResetData: () => void;
  onDownloadStandaloneHtml?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  appData,
  activeClass,
  activeAssignment,
  onImportData,
  onResetData,
  onDownloadStandaloneHtml,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!isOpen) return null;

  // JSON Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `CheckHW_備份資料_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!activeClass || !activeAssignment) return;
    const csvContent = exportAssignmentCSV(
      activeClass,
      activeAssignment,
      appData.students,
      appData.statuses
    );
    // Add BOM for Excel UTF-8 display
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeClass.name}_${activeAssignment.title}_繳交清單.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateImportData(parsed);

        if (!validation.valid || !validation.data) {
          setImportStatus({
            type: 'error',
            message: validation.error || '檔案格式不正確，無法匯入',
          });
          return;
        }

        onImportData(validation.data);
        setImportStatus({
          type: 'success',
          message: `備份資料已成功匯入！已載入 ${validation.data.classes.length} 個班級、${validation.data.assignments.length} 個作業紀錄。`,
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: '無法解析 JSON 檔案，請確認檔案格式是否正確',
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>資料備份、匯出與復原</span>
            </h2>
            <p className="text-xs text-slate-500">
              管理目前儲存於此瀏覽器的本機紀錄
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Note about LocalStorage */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 leading-relaxed">
            <span className="font-bold">⚠️ 本機保存說明：</span> 目前第一階段資料完全安全地存於本機瀏覽器（localStorage），重新整理或重啟瀏覽器均會保留；但不同裝置（如手機與電腦）暫未自動同步，請隨時匯出備份或留待第二階段啟用 Firebase 雲端同步。
          </div>

          {/* Import Status Message */}
          {importStatus.type !== 'idle' && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Action 1: Export JSON */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800 text-sm">
                完整系統備份檔 (JSON)
              </div>
              <div className="text-slate-500 mt-0.5">
                包含所有班級、學生座號名單、全部作業及歷史繳交紀錄。
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              下載備份
            </button>
          </div>

          {/* Action 2: Export CSV for Excel */}
          {activeClass && activeAssignment && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-800 text-sm">
                  匯出當前作業名單 (Excel / CSV)
                </div>
                <div className="text-slate-500 mt-0.5">
                  匯出「{activeAssignment.title}」的詳細座號繳交名單試算表。
                </div>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                匯出 CSV
              </button>
            </div>
          )}

          {/* Action 3: Import JSON */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800 text-sm">
                匯入備份檔 (JSON)
              </div>
              <div className="text-slate-500 mt-0.5">
                從其他電腦或先前備份的檔案還原班級紀錄。
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              選擇檔案匯入
            </button>
          </div>

          {/* Action 4: Download Standalone Single-file HTML */}
          {onDownloadStandaloneHtml && (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-amber-900 text-sm flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-700" />
                  下載單一檔案 HTML (免安裝雙擊即開版)
                </div>
                <div className="text-amber-700 mt-0.5">
                  整套 HTML、CSS 與 JS 合併成單一檔案，不用安裝 Node.js，放隨身碟隨開隨用！
                </div>
              </div>
              <button
                onClick={onDownloadStandaloneHtml}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                下載 HTML
              </button>
            </div>
          )}

          {/* Action 5: Reset to clean empty state */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-400">想完全清空目前資料？</span>
            {isConfirmingReset ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-lg p-1.5 animate-in fade-in">
                <span className="text-rose-700 font-bold text-xs">確定全部清空？</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetData();
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  確認清空
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                清空為乾淨空白狀態（不留範本）
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
