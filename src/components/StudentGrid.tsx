import React, { useState, useRef } from 'react';
import { 
  Check, 
  AlertTriangle, 
  Circle, 
  Filter, 
  Repeat, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Zap,
  MoreVertical
} from 'lucide-react';
import { StudentRecord, SubmissionStatus, StatusType } from '../types';

export type ClickMode = 'smart' | 'stamp-completed' | 'stamp-need-fix' | 'stamp-pending' | 'cycle';

interface StudentGridProps {
  students: StudentRecord[];
  statuses: SubmissionStatus[];
  assignmentId: string;
  onToggleStudentStatus: (studentId: string, currentStatus: StatusType) => void;
  onSetStudentStatus: (studentId: string, targetStatus: StatusType) => void;
  onResetStudentStatus: (studentId: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onOpenClassManage?: () => void;
  statsBar?: React.ReactNode;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  statuses,
  assignmentId,
  onToggleStudentStatus,
  onSetStudentStatus,
  onResetStudentStatus,
  onDeleteStudent,
  onOpenClassManage,
  statsBar,
}) => {
  // Click mode state: default to 'smart' (one-tap toggle submitted/missing, dedicated button for need-fix)
  const [clickMode, setClickMode] = useState<ClickMode>('smart');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'need-fix' | 'completed'>('all');
  const [activePopoverStudentId, setActivePopoverStudentId] = useState<string | null>(null);

  // Long press timer ref for mobile
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Map studentId to current status
  const statusMap = new Map<string, StatusType>();
  statuses
    .filter((s) => s.assignmentId === assignmentId)
    .forEach((s) => statusMap.set(s.studentId, s.status));

  // Sort students strictly by seatNumber
  const sortedStudents = [...students]
    .filter((s) => s.isActive)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  // Filter students based on filterMode
  const filteredStudents = sortedStudents.filter((student) => {
    const status = statusMap.get(student.id) || 'pending';
    if (filterMode === 'all') return true;
    return status === filterMode;
  });

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  };

  // Main tap handler according to selected ClickMode
  const handleSeatClick = (studentId: string, currentStatus: StatusType) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    triggerHaptic();

    switch (clickMode) {
      case 'stamp-completed':
        // Stamp as Completed (toggle to pending if already completed)
        onSetStudentStatus(studentId, currentStatus === 'completed' ? 'pending' : 'completed');
        break;

      case 'stamp-need-fix':
        // Stamp as Need-Fix (toggle to pending if already need-fix)
        onSetStudentStatus(studentId, currentStatus === 'need-fix' ? 'pending' : 'need-fix');
        break;

      case 'stamp-pending':
        // Stamp as Pending/Missing
        onSetStudentStatus(studentId, 'pending');
        break;

      case 'cycle':
        // Traditional 3-state cycle: pending -> completed -> need-fix -> pending
        onToggleStudentStatus(studentId, currentStatus);
        break;

      case 'smart':
      default:
        // Smart binary toggle: if pending -> completed; if completed/need-fix -> pending
        if (currentStatus === 'pending') {
          onSetStudentStatus(studentId, 'completed');
        } else {
          onSetStudentStatus(studentId, 'pending');
        }
        break;
    }
  };

  // Dedicated tap on top-right badge to directly toggle Need-Fix
  const handleBadgeClick = (e: React.MouseEvent, studentId: string, currentStatus: StatusType) => {
    e.stopPropagation();
    triggerHaptic();
    if (currentStatus === 'need-fix') {
      onSetStudentStatus(studentId, 'completed');
    } else {
      onSetStudentStatus(studentId, 'need-fix');
    }
  };

  // Open popover menu for fine-grained choice
  const handleOpenPopover = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    setActivePopoverStudentId((prev) => (prev === studentId ? null : studentId));
  };

  // Touch start for long-press popover
  const handleTouchStart = (studentId: string) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic();
      setActivePopoverStudentId(studentId);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
      {/* 1. FILTER TABS & STATUS LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-white p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
          <span className="text-slate-400 font-normal">狀態圖例：</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-slate-100 flex items-center justify-center text-[9px] text-slate-600 font-bold">○</span>
            <span>缺交/未交</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">✓</span>
            <span className="text-blue-700 font-semibold">已交</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-[9px] text-white font-bold">!</span>
            <span className="text-rose-700 font-semibold">需訂正</span>
          </div>
        </div>

        {/* View Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部 ({sortedStudents.length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterMode === 'pending'
                ? 'bg-slate-800 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            缺交名單
          </button>
          <button
            onClick={() => setFilterMode('need-fix')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterMode === 'need-fix'
                ? 'bg-rose-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            需訂正
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterMode === 'completed'
                ? 'bg-blue-700 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            已交
          </button>

          {onOpenClassManage && (
            <button
              type="button"
              onClick={onOpenClassManage}
              title="快速調整班級人數或刪除多餘號碼"
              className="ml-1 px-2.5 py-1 rounded-md text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <span>✂️ 調整班級人數</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. SEAT NUMBER GRID */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">目前沒有符合此篩選條件的學生座號</p>
          <button
            onClick={() => setFilterMode('all')}
            className="mt-2 text-xs text-blue-600 hover:underline font-medium"
          >
            切換回顯示全部座號
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
          {filteredStudents.map((student) => {
            const status = statusMap.get(student.id) || 'pending';
            const isPopoverOpen = activePopoverStudentId === student.id;

            let cardStyle = '';
            let iconElement = null;
            let statusLabel = '缺交';

            if (status === 'completed') {
              cardStyle = 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20';
              iconElement = <Check className="w-4 h-4 stroke-[3]" />;
              statusLabel = '已交';
            } else if (status === 'need-fix') {
              cardStyle = 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs ring-2 ring-rose-600/20';
              iconElement = <AlertTriangle className="w-4 h-4 stroke-[2.5]" />;
              statusLabel = '需訂正';
            } else {
              cardStyle = 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs';
              iconElement = <Circle className="w-3.5 h-3.5 stroke-[2.5] text-slate-400" />;
              statusLabel = '缺交';
            }

            return (
              <div key={student.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleSeatClick(student.id, status)}
                  onTouchStart={() => handleTouchStart(student.id)}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleOpenPopover(e, student.id);
                  }}
                  title={`${student.seatNumber} 號 ${student.name ? `(${student.name})` : ''} - 目前：${statusLabel} (點擊依模式切換，右鍵或長按彈出快選)`}
                  className={`w-full relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-150 select-none cursor-pointer active:scale-95 min-h-[76px] sm:min-h-[82px] ${cardStyle}`}
                >
                  {/* Top-Right Quick Toggle Button (Clicking directly toggles Need-Fix in Smart Mode) */}
                  <div
                    onClick={(e) => handleBadgeClick(e, student.id, status)}
                    title={status === 'need-fix' ? '點擊解除需訂正' : '直覺點擊：直接標記為需訂正 (!)'}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-transform active:scale-125 cursor-pointer ${
                      status === 'need-fix'
                        ? 'bg-white text-rose-600 font-bold shadow-xs'
                        : status === 'completed'
                        ? 'text-white/80 hover:text-white hover:bg-blue-700'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                    }`}
                  >
                    {iconElement}
                  </div>

                  {/* Seat Number */}
                  <div className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                    {student.seatNumber}
                  </div>

                  {/* Student Name */}
                  {student.name && (
                    <div className="text-[11px] truncate max-w-full px-1 font-semibold leading-tight mt-0.5">
                      {student.name}
                    </div>
                  )}

                  {/* Status Label (ALWAYS visible: 缺交 / 已交 / 需訂正) */}
                  <div className="mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-0.5 ${
                      status === 'completed'
                        ? 'bg-blue-800/50 text-white'
                        : status === 'need-fix'
                        ? 'bg-rose-800/50 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {status === 'completed' && '✓ 已交'}
                      {status === 'need-fix' && '! 需訂正'}
                      {status === 'pending' && '○ 缺交'}
                    </span>
                  </div>
                </button>

                {/* Direct 3-Choice Quick Action Popover (for instant, foolproof selection) */}
                {isPopoverOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActivePopoverStudentId(null)}
                    />
                    <div className="absolute z-50 -top-12 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-200 p-1 flex items-center gap-1 text-xs shrink-0 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic();
                          onSetStudentStatus(student.id, 'completed');
                          setActivePopoverStudentId(null);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-blue-700"
                      >
                        ✓ 已交
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic();
                          onSetStudentStatus(student.id, 'need-fix');
                          setActivePopoverStudentId(null);
                        }}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-rose-700"
                      >
                        ! 需訂正
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic();
                          onSetStudentStatus(student.id, 'pending');
                          setActivePopoverStudentId(null);
                        }}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold flex items-center gap-1 hover:bg-slate-200"
                      >
                        ○ 缺交
                      </button>

                      {onDeleteStudent && (
                        <>
                          <div className="w-px h-5 bg-slate-200 mx-0.5" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic();
                              onDeleteStudent(student.id);
                              setActivePopoverStudentId(null);
                            }}
                            title={`永久刪除 ${student.seatNumber} 號`}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg font-bold flex items-center gap-1 border border-rose-200 transition-colors"
                          >
                            🗑️ 刪除此號
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. STATS & PROGRESS BAR (統計與進度列 - 位於座號正下方) */}
      {statsBar && (
        <div className="mt-4 mb-3">
          {statsBar}
        </div>
      )}

      {/* 2. INTUITIVE CLICK MODE SELECTOR (直覺點法工具列 - 位於統計列下方) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-2 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span className="text-base">🎯</span>
            <span>選擇最直覺的點法模式：</span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            可依批改情境隨時切換點法
          </div>
        </div>

        {/* Big Intuitive Mode Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {/* Smart Toggle */}
          <button
            type="button"
            onClick={() => setClickMode('smart')}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              clickMode === 'smart'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold ring-2 ring-blue-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>智慧單擊模式</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'smart' ? 'text-blue-100' : 'text-slate-400'}`}>
              點一下已交 / 缺交，角標設訂正
            </span>
          </button>

          {/* Stamp: Need-Fix */}
          <button
            type="button"
            onClick={() => setClickMode('stamp-need-fix')}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              clickMode === 'stamp-need-fix'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold ring-2 ring-rose-600/20'
                : 'bg-rose-50/60 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>🔴 需訂正筆刷</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'stamp-need-fix' ? 'text-rose-100' : 'text-rose-500'}`}>
              點哪個座號就直接變需訂正
            </span>
          </button>

          {/* Stamp: Completed */}
          <button
            type="button"
            onClick={() => setClickMode('stamp-completed')}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              clickMode === 'stamp-completed'
                ? 'bg-blue-700 text-white border-blue-700 shadow-xs font-bold ring-2 ring-blue-600/20'
                : 'bg-blue-50/60 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>🔵 已交筆刷</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'stamp-completed' ? 'text-blue-100' : 'text-blue-500'}`}>
              點哪個座號就直接標記已交
            </span>
          </button>

          {/* Cycle Mode */}
          <button
            type="button"
            onClick={() => setClickMode('cycle')}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
              clickMode === 'cycle'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs font-bold ring-2 ring-slate-800/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs">
              <Repeat className="w-3.5 h-3.5" />
              <span>三態循環點擊</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'cycle' ? 'text-slate-200' : 'text-slate-400'}`}>
              缺交 ➔ 已交 ➔ 需訂正 ➔ 缺交
            </span>
          </button>
        </div>

        {/* Mode Explanatory Banner */}
        <div className="px-2.5 py-1.5 bg-slate-100/80 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
          <div>
            {clickMode === 'smart' && (
              <span>⚡ <strong>智慧單擊模式：</strong> 點擊座號快速切換「已交 ✓」與「缺交 ○」；若要標記訂正，點右上角 <strong>[!]</strong> 或長按座號！</span>
            )}
            {clickMode === 'stamp-need-fix' && (
              <span className="text-rose-700 font-medium">🔴 <strong>需訂正筆刷已啟動：</strong> 現在只要輕觸任何座號，立即直接標記為「需訂正」！</span>
            )}
            {clickMode === 'stamp-completed' && (
              <span className="text-blue-700 font-medium">🔵 <strong>已交筆刷已啟動：</strong> 輕觸任何座號即可直接標記為「已交」！</span>
            )}
            {clickMode === 'stamp-pending' && (
              <span>⚪ <strong>缺交筆刷已啟動：</strong> 輕觸座號直接還原為「缺交/未交」！</span>
            )}
            {clickMode === 'cycle' && (
              <span>🔄 <strong>循環模式：</strong> 每次點擊依序切換「缺交 ➔ 已交 ➔ 需訂正」。</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setClickMode('stamp-pending')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors shrink-0 ml-2 ${
              clickMode === 'stamp-pending'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⚪ 缺交筆刷
          </button>
        </div>
      </div>

      {/* Footer Helper Note */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <span>💡 支援直覺快捷：電腦按右鍵、手機長按座號，可直接彈出「已交 / 需訂正 / 缺交」三合一快選！</span>
        <span>有效學生：{sortedStudents.length} 人</span>
      </div>
    </div>
  );
};
