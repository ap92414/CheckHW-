import React from 'react';
import { 
  Users, 
  RotateCcw, 
  CloudOff, 
  Database, 
  Settings, 
  Plus, 
  ChevronDown,
  BookOpen,
  Lock,
  Unlock,
  Crown,
  ShieldAlert
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
  roomCode?: string;
  isTeacherUnlocked: boolean;
  onOpenPasswordModal: () => void;
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
  roomCode = '',
  isTeacherUnlocked,
  onOpenPasswordModal,
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
                {classes.length === 0 ? (
                  <option value="">無班級資料</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentCount}人)
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 -ml-5 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Teacher Mode: 名單設定 (Only visible for teacher admin) */}
          {isTeacherUnlocked && (
            <button
              onClick={onOpenClassManage}
              title="班級與學生座號名單設定"
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">名單設定</span>
            </button>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo Button (Available in both modes for easy misclick recovery) */}
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

          {/* Teacher Only: Backup / Export */}
          {isTeacherUnlocked && (
            <button
              onClick={onOpenBackup}
              title="資料備份與匯出 (JSON / CSV)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
            </button>
          )}

          {/* Teacher Only: Development Log */}
          {isTeacherUnlocked && (
            <button
              onClick={onOpenDevLog}
              title="查看完整研發日誌 (Changelog)"
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">研發日誌</span>
            </button>
          )}

          {/* Firebase / Classroom Room Code Status Badge */}
          <button
            onClick={onOpenFirebase}
            title={roomCode ? `已連線教室【${roomCode}】（點擊管理）` : '點擊設定教室配對碼（手機⇋大螢幕即時同步）'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              roomCode 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${roomCode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="hidden xs:inline">
              {roomCode ? `教室 ${roomCode}` : '教室配對'}
            </span>
            <span className={`text-[10px] px-1 rounded-sm border ${
              roomCode ? 'bg-white text-emerald-700 border-emerald-200 font-bold' : 'bg-white text-slate-500 border-slate-200'
            }`}>
              {roomCode ? '即時' : '未連線'}
            </span>
          </button>

          {/* Teacher Permission Unlock/Lock Button */}
          <button
            onClick={onOpenPasswordModal}
            title={isTeacherUnlocked ? '點擊鎖定為大螢幕/小老師安全模式' : '點擊輸入密碼解鎖教師管理權限'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isTeacherUnlocked
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
            }`}
          >
            {isTeacherUnlocked ? (
              <>
                <Crown className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">教師權限</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">解鎖權限</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
