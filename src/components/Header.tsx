import React from 'react';
import { 
  Users, 
  RotateCcw, 
  CloudOff, 
  Database, 
  Settings, 
  Plus, 
  ChevronDown,
  BookOpen
} from 'lucide-react';
import { ClassRecord } from '../types';

interface HeaderProps {
  classes: ClassRecord[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenClassManage: () => void;
  onOpenBackup: () => void;
  onOpenFirebase: () => void;
  onOpenDevLog: () => void;
  canUndo: boolean;
  onUndo: () => void;
  isCloudSyncActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onOpenClassManage,
  onOpenBackup,
  onOpenFirebase,
  onOpenDevLog,
  canUndo,
  onUndo,
  isCloudSyncActive = false,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Class Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              HW
            </div>
            <span className="font-bold text-slate-800 text-base sm:text-lg tracking-tight hidden xs:inline">
              CheckHW
            </span>
          </div>

          <div className="relative inline-block text-left">
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-lg p-0.5 border border-slate-200 transition-colors">
              <select
                aria-label="選擇班級"
                value={activeClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="appearance-none bg-transparent pl-2.5 pr-7 py-1 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.studentCount}人)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 -ml-5 pointer-events-none shrink-0" />
            </div>
          </div>

          <button
            onClick={onOpenClassManage}
            title="班級與學生座號名單設定"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">名單設定</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? '復原上一步座號點擊 (Ctrl+Z)' : '尚無可復原的操作'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 active:scale-95'
                : 'text-slate-300 border border-transparent cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">復原點擊</span>
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            title="資料備份與匯出 (JSON / CSV)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Development Log Button */}
          <button
            onClick={onOpenDevLog}
            title="查看完整研發日誌 (Changelog)"
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">研發日誌</span>
          </button>

          {/* Firebase / Cloud Sync Status Badge */}
          <button
            onClick={onOpenFirebase}
            title={isCloudSyncActive ? '雲端即時雙向同步中（點擊查看）' : '純本機模式（點擊開啟雲端同步）'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isCloudSyncActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isCloudSyncActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="hidden md:inline">{isCloudSyncActive ? '雲端同步' : '本機儲存'}</span>
            <span className={`text-[10px] px-1 rounded-sm border ${
              isCloudSyncActive ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
            }`}>
              {isCloudSyncActive ? '即時' : '離線安全'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
