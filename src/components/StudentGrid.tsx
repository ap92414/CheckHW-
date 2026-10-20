import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  LayoutGrid,
  Armchair,
  Eye,
  Columns,
  ArrowDownUp,
  FlipHorizontal,
  Compass,
  ArrowLeftRight,
  RotateCcw,
  Sparkles,
  CheckCheck,
  Lock
} from 'lucide-react';
import { StudentRecord, SubmissionStatus, StatusType } from '../types';

export type ClickMode = 'smart' | 'stamp-completed' | 'stamp-need-fix' | 'stamp-pending' | 'cycle';
export type ViewMode = 'grid' | 'seating';
export type SeatingPerspective = 'teacher' | 'student';
export type SeatingFillOrder = 'col' | 'row';

interface StudentGridProps {
  students: StudentRecord[];
  statuses: SubmissionStatus[];
  assignmentId: string;
  classId?: string;
  onToggleStudentStatus: (studentId: string, currentStatus: StatusType) => void;
  onSetStudentStatus: (studentId: string, targetStatus: StatusType) => void;
  onResetStudentStatus: (studentId: string) => void;
  onDeleteStudent?: (studentId: string) => void;
  onOpenClassManage?: () => void;
  onUpdateStudents?: (classId: string, updatedStudents: StudentRecord[]) => void;
  isTeacherUnlocked?: boolean;
  onOpenPasswordModal?: () => void;
  statsBar?: React.ReactNode;
  onOpenBlackboard?: () => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  statuses,
  assignmentId,
  classId = '',
  onToggleStudentStatus,
  onSetStudentStatus,
  onResetStudentStatus,
  onDeleteStudent,
  onOpenClassManage,
  onUpdateStudents,
  isTeacherUnlocked = false,
  onOpenPasswordModal,
  statsBar,
  onOpenBlackboard,
}) => {
  // View mode: 'grid' (座號排序) or 'seating' (教室座位表)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('checkhw_view_mode') as ViewMode) || 'grid';
  });

  // Seating chart perspective: 'teacher' (從講台往下看) or 'student' (從學生方向看)
  const [seatingPerspective, setSeatingPerspective] = useState<SeatingPerspective>(() => {
    return (localStorage.getItem('checkhw_seating_perspective') as SeatingPerspective) || 'teacher';
  });

  // Podium position: 'top' (講台在上方) or 'bottom' (講台在下方)
  const [podiumPosition, setPodiumPosition] = useState<'top' | 'bottom'>(() => {
    const saved = localStorage.getItem('checkhw_podium_pos');
    if (saved === 'top' || saved === 'bottom') return saved;
    return (localStorage.getItem('checkhw_seating_perspective') as SeatingPerspective) === 'student' ? 'top' : 'bottom';
  });

  // Seating chart columns: default 5 or 6 based on student count
  const [seatingColumns, setSeatingColumns] = useState<number>(() => {
    const saved = localStorage.getItem('checkhw_seating_cols');
    if (saved) return Number(saved) || 6;
    return students.length <= 25 ? 5 : 6;
  });

  // Seating fill order: 'col' (直排 1,2,3,4,5 向下) or 'row' (橫排 1,2,3,4,5,6 向右)
  const [seatingFillOrder, setSeatingFillOrder] = useState<SeatingFillOrder>(() => {
    return (localStorage.getItem('checkhw_seating_fill') as SeatingFillOrder) || 'col';
  });

  // Seating Adjustment Mode (換座位/對調)
  const [isAdjustingSeats, setIsAdjustingSeats] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<{ deskIndex: number; student: StudentRecord | null } | null>(null);
  const [adjustFeedback, setAdjustFeedback] = useState<string>('');

  // Click mode state: default to 'smart'
  const [clickMode, setClickMode] = useState<ClickMode>('smart');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'need-fix' | 'completed'>('all');
  const [activePopoverStudentId, setActivePopoverStudentId] = useState<string | null>(null);

  // Persist view settings
  useEffect(() => {
    localStorage.setItem('checkhw_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('checkhw_seating_perspective', seatingPerspective);
  }, [seatingPerspective]);

  useEffect(() => {
    localStorage.setItem('checkhw_podium_pos', podiumPosition);
  }, [podiumPosition]);

  useEffect(() => {
    localStorage.setItem('checkhw_seating_cols', seatingColumns.toString());
  }, [seatingColumns]);

  useEffect(() => {
    localStorage.setItem('checkhw_seating_fill', seatingFillOrder);
  }, [seatingFillOrder]);

  // When switching perspective: automatically flip podium position to match!
  const handleSelectPerspective = (p: SeatingPerspective) => {
    setSeatingPerspective(p);
    if (p === 'teacher') {
      setPodiumPosition('bottom');
    } else {
      setPodiumPosition('top');
    }
  };

  // If teacher permissions are locked, automatically exit seat adjust mode
  useEffect(() => {
    if (!isTeacherUnlocked) {
      setIsAdjustingSeats(false);
      setSelectedDesk(null);
    }
  }, [isTeacherUnlocked]);

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
        onSetStudentStatus(studentId, currentStatus === 'completed' ? 'pending' : 'completed');
        break;

      case 'stamp-need-fix':
        onSetStudentStatus(studentId, currentStatus === 'need-fix' ? 'pending' : 'need-fix');
        break;

      case 'stamp-pending':
        onSetStudentStatus(studentId, 'pending');
        break;

      case 'cycle':
        onToggleStudentStatus(studentId, currentStatus);
        break;

      case 'smart':
      default:
        if (currentStatus === 'completed') {
          onSetStudentStatus(studentId, 'pending');
        } else {
          onSetStudentStatus(studentId, 'completed');
        }
        break;
    }
  };

  // Badge click for quick "need-fix" in Smart Mode
  const handleBadgeClick = (e: React.MouseEvent, studentId: string, currentStatus: StatusType) => {
    e.stopPropagation();
    triggerHaptic();
    if (currentStatus === 'need-fix') {
      onSetStudentStatus(studentId, 'pending');
    } else {
      onSetStudentStatus(studentId, 'need-fix');
    }
  };

  // Popover open
  const handleOpenPopover = (e: React.MouseEvent, studentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePopoverStudentId(studentId);
  };

  // Mobile long press support
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

  // Calculate Seating Chart Grid Matrix
  const cols = Math.max(3, Math.min(8, seatingColumns));
  const rows = Math.max(1, Math.ceil(sortedStudents.length / cols));
  const totalDesks = rows * cols;

  // Build Map of deskIndex -> StudentRecord
  const deskToStudentMap = new Map<number, StudentRecord>();
  sortedStudents.forEach((student, idx) => {
    // If student has explicit deskIndex, use it; otherwise fallback to natural order idx
    const assignedDesk = student.deskIndex !== undefined ? student.deskIndex : idx;
    deskToStudentMap.set(assignedDesk, student);
  });

  // Build rows x cols matrix
  // If perspective === 'teacher' (從講台看), columns are flipped horizontally compared to student view!
  // If podiumPosition === 'bottom' (講台在下方·老師站位), Row 1 is closest to podium at bottom!
  interface DeskCell {
    deskIndex: number;
    student: StudentRecord | null;
    physicalRow: number;
    physicalCol: number;
  }
  const seatingGrid: DeskCell[][] = [];

  for (let r = 0; r < rows; r++) {
    const rowList: DeskCell[] = [];
    const physicalRow = podiumPosition === 'bottom' ? rows - 1 - r : r;

    for (let c = 0; c < cols; c++) {
      // physical column based on perspective:
      const physicalCol = seatingPerspective === 'teacher' ? cols - 1 - c : c;

      let canonicalDeskIndex = -1;
      if (seatingFillOrder === 'col') {
        canonicalDeskIndex = physicalCol * rows + physicalRow;
      } else {
        canonicalDeskIndex = physicalRow * cols + physicalCol;
      }

      const student = deskToStudentMap.get(canonicalDeskIndex) || null;
      rowList.push({ deskIndex: canonicalDeskIndex, student, physicalRow, physicalCol });
    }
    seatingGrid.push(rowList);
  }

  // Handle Desk Swap in Seating Adjustment Mode
  const handleDeskClickInAdjustMode = (deskIndex: number, currentStudent: StudentRecord | null) => {
    triggerHaptic();

    if (!selectedDesk) {
      // Step 1: Select the first desk
      setSelectedDesk({ deskIndex, student: currentStudent });
      setAdjustFeedback(
        currentStudent 
          ? `已選中【${currentStudent.seatNumber} 號 ${currentStudent.name}】，請再點選另一個座位或空位進行對調！`
          : '已選中此空位，請再點選另一位學生將其移至此處！'
      );
      return;
    }

    // If clicked the exact same desk, deselect
    if (selectedDesk.deskIndex === deskIndex) {
      setSelectedDesk(null);
      setAdjustFeedback('已取消選取');
      return;
    }

    // Step 2: Swap the two desks!
    const desk1 = selectedDesk.deskIndex;
    const student1 = selectedDesk.student;
    const desk2 = deskIndex;
    const student2 = currentStudent;

    if (!onUpdateStudents || !classId) return;

    // Build mapping of every active student to their currently occupied physical desk
    const currentDeskMap = new Map<string, number>();
    sortedStudents.forEach((st, naturalIdx) => {
      const currentDesk = st.deskIndex !== undefined ? st.deskIndex : naturalIdx;
      currentDeskMap.set(st.id, currentDesk);
    });

    // Safely swap without index collisions or displacing other students
    const updatedStudents = students.map((s) => {
      if (!s.isActive) return s;

      if (student1 && s.id === student1.id) {
        return { ...s, deskIndex: desk2 };
      }
      if (student2 && s.id === student2.id) {
        return { ...s, deskIndex: desk1 };
      }

      // Preserve existing assigned physical desk
      const existingDesk = currentDeskMap.get(s.id);
      return { ...s, deskIndex: existingDesk };
    });

    onUpdateStudents(classId, updatedStudents);

    let msg = '座位已成功調整！';
    if (student1 && student2) {
      msg = `✅ 已成功對調【${student1.seatNumber} 號】與【${student2.seatNumber} 號】的座位！`;
    } else if (student1 && !student2) {
      msg = `✅ 已將【${student1.seatNumber} 號】移至新座位！`;
    } else if (!student1 && student2) {
      msg = `✅ 已將【${student2.seatNumber} 號】移至新座位！`;
    }

    setAdjustFeedback(msg);
    setSelectedDesk(null);
  };

  // Reset all student seats to natural sequential order
  const handleResetToDefaultSeats = () => {
    if (!onUpdateStudents || !classId) return;
    triggerHaptic();
    const resetList = students.map((s) => ({
      ...s,
      deskIndex: undefined,
    }));
    onUpdateStudents(classId, resetList);
    setSelectedDesk(null);
    setAdjustFeedback('已恢復為依座號預設順序排列！');
  };

  // Render a Single Student Seat Button (Shared between List View and Seating View)
  const renderStudentSeatButton = (
    student: StudentRecord, 
    isSeatingDesk = false, 
    deskIndex?: number
  ) => {
    const status = statusMap.get(student.id) || 'pending';
    const isPopoverOpen = activePopoverStudentId === student.id;
    const isSelectedForSwap = isAdjustingSeats && deskIndex !== undefined && selectedDesk?.deskIndex === deskIndex;

    let cardStyle = '';
    let iconElement = null;
    let statusLabel = '缺交';

    if (isAdjustingSeats) {
      // In adjusting mode
      cardStyle = isSelectedForSwap
        ? 'bg-amber-100 text-amber-900 border-amber-500 shadow-md ring-4 ring-amber-400 scale-105 z-20'
        : 'bg-white hover:bg-amber-50 text-slate-800 border-dashed border-2 border-slate-300 hover:border-amber-400 shadow-2xs';
    } else if (status === 'completed') {
      cardStyle = 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/25';
      iconElement = <Check className="w-5 h-5 stroke-[3]" />;
      statusLabel = '已交';
    } else if (status === 'need-fix') {
      cardStyle = 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm ring-2 ring-rose-600/25';
      iconElement = <AlertTriangle className="w-5 h-5 stroke-[2.5]" />;
      statusLabel = '需訂正';
    } else {
      cardStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs';
      iconElement = <Circle className="w-4 h-4 stroke-[2.5] text-slate-400" />;
      statusLabel = '缺交';
    }

    return (
      <div key={student.id} className="relative w-full">
        <button
          type="button"
          onClick={() => {
            if (isAdjustingSeats && deskIndex !== undefined) {
              handleDeskClickInAdjustMode(deskIndex, student);
            } else {
              handleSeatClick(student.id, status);
            }
          }}
          onTouchStart={() => !isAdjustingSeats && handleTouchStart(student.id)}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => {
            if (!isAdjustingSeats) {
              e.preventDefault();
              handleOpenPopover(e, student.id);
            }
          }}
          title={
            isAdjustingSeats 
              ? `點擊以對調 ${student.seatNumber} 號 的座位` 
              : `${student.seatNumber} 號 ${student.name ? `(${student.name})` : ''} - 目前：${statusLabel}`
          }
          className={`w-full relative flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all duration-150 select-none cursor-pointer active:scale-95 ${
            isSeatingDesk ? 'min-h-[100px] sm:min-h-[115px]' : 'min-h-[96px] sm:min-h-[110px]'
          } ${cardStyle}`}
        >
          {/* Top-Right Badge: Swap icon in edit mode, status icon in normal mode */}
          {isAdjustingSeats ? (
            <div className={`absolute top-2 right-2 p-1 rounded-lg ${isSelectedForSwap ? 'bg-amber-500 text-white animate-spin' : 'text-slate-400'}`}>
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          ) : (
            <div
              onClick={(e) => handleBadgeClick(e, student.id, status)}
              title={status === 'need-fix' ? '點擊解除需訂正' : '直覺點擊：直接標記為需訂正 (!)'}
              className={`absolute top-2 right-2 p-1 rounded-lg transition-transform active:scale-125 cursor-pointer ${
                status === 'need-fix'
                  ? 'bg-white text-rose-600 font-bold shadow-xs'
                  : status === 'completed'
                  ? 'text-white/80 hover:text-white hover:bg-blue-700'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
              }`}
            >
              {iconElement}
            </div>
          )}

          {/* Seat Number (Large, high visibility font) */}
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none mt-1">
            {student.seatNumber}
          </div>

          {/* Student Name */}
          <div className="text-xs sm:text-sm truncate max-w-full px-1 font-bold leading-tight mt-1 text-center">
            {student.name || <span className="opacity-0">空</span>}
          </div>

          {/* Status Badge */}
          <div className="mt-1">
            {isAdjustingSeats ? (
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                isSelectedForSwap ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isSelectedForSwap ? '選取中 ⇄' : '點此換位'}
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-md text-xs font-black tracking-tight inline-flex items-center gap-1 ${
                status === 'completed'
                  ? 'bg-blue-800/60 text-white'
                  : status === 'need-fix'
                  ? 'bg-rose-800/60 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {status === 'completed' && '✓ 已交'}
                {status === 'need-fix' && '! 需訂正'}
                {status === 'pending' && '○ 缺交'}
              </span>
            )}
          </div>
        </button>

        {/* 3-Choice Quick Action Popover */}
        {isPopoverOpen && !isAdjustingSeats && (
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
  };

  // Render Blackboard / Podium Indicator Banner
  const renderPodiumBanner = () => (
    <div className="max-w-xl mx-auto my-3 text-center animate-in fade-in">
      {podiumPosition === 'bottom' && (
        <div className="text-[11px] text-slate-500 font-bold mb-1.5 flex items-center justify-center gap-1">
          <span>▲ 第一排（最靠近講台老師）▲</span>
        </div>
      )}
      <div className="relative bg-slate-800 text-white py-2.5 px-2 rounded-xl shadow-md border-b-4 border-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto font-black text-sm sm:text-base tracking-widest">
          <span>🏫</span>
          <span>【 講台 】</span>
        </div>
      </div>
    </div>
  );

  // Render Classroom Back Indicator
  const renderClassroomBackBanner = () => (
    <div className="max-w-xl mx-auto my-2 text-center">
      <div className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2 py-1.5">
        <span>🚪 教室後方</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
      {/* 1. TOP VIEW MODE & PERSPECTIVE TOOLBAR */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-xs mb-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* View Mode Switcher: 座號清單 vs 座位表 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setIsAdjustingSeats(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>座號排序清單</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('seating')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'seating'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Armchair className="w-4 h-4" />
              <span>教室座位表顯示</span>
            </button>

            {onOpenBlackboard && (
              <button
                type="button"
                onClick={onOpenBlackboard}
                title="開啟黑板缺交登記榜（全班作業中文直式列表 / 超大字體 / 大螢幕投影）"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-[#142e20] text-emerald-300 hover:bg-[#1a3d2b] border border-emerald-600/40 shadow-xs"
              >
                <span>🏫</span>
                <span>黑板缺交榜</span>
              </button>
            )}
          </div>

          {/* Perspective & Seating Controls (Visible only in Seating Mode) */}
          {viewMode === 'seating' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Perspective Selector (Two Directions with linked Podium Position) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 pl-1.5 pr-0.5 hidden xs:inline">視角：</span>
                <button
                  type="button"
                  onClick={() => handleSelectPerspective('teacher')}
                  title="從講台往下看：講台自動換至下方（老師站位），第一排在前俯瞰全班"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    seatingPerspective === 'teacher'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>👨‍🏫 從講台往下看</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPerspective('student')}
                  title="從學生方向看：講台自動換至上方（黑板前），學生向前看黑板"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    seatingPerspective === 'student'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>🧑‍🎓 從學生方向看</span>
                </button>
              </div>

              {/* Podium Position Fast Toggle (講台位置快速對調) */}
              <button
                type="button"
                onClick={() => setPodiumPosition((prev) => (prev === 'top' ? 'bottom' : 'top'))}
                title="講台位置對調：自由切換講台在下方（老師站位）或在上方（黑板前），更符合老師上課需求"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
                <span>講台在{podiumPosition === 'bottom' ? '下方 (老師站位)' : '上方 (黑板前)'}</span>
              </button>

              {/* Adjust Seating Button (換座位對調 - 限教師權限) */}
              <button
                type="button"
                onClick={() => {
                  if (!isTeacherUnlocked) {
                    if (onOpenPasswordModal) {
                      onOpenPasswordModal();
                    }
                    return;
                  }
                  setIsAdjustingSeats(!isAdjustingSeats);
                  setSelectedDesk(null);
                  setAdjustFeedback('');
                }}
                title={!isTeacherUnlocked ? '換座位屬於教師管理權限，點此輸入密碼解鎖' : '點擊開始對調學生座位'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isAdjustingSeats
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                    : isTeacherUnlocked
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                }`}
              >
                {isTeacherUnlocked ? (
                  <>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{isAdjustingSeats ? '✓ 完成座位調整' : '✏️ 調整座位 (對調/換位)'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>調整座位 (需教師權限)</span>
                  </>
                )}
              </button>

              {/* Columns Count Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-[11px] font-bold text-slate-500 pl-1.5 pr-0.5 hidden sm:inline">排數：</span>
                {[4, 5, 6, 7].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSeatingColumns(c)}
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                      seatingColumns === c
                        ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c}縱行
                  </button>
                ))}
              </div>

              {/* Fill Order Selector: 直排 vs 橫排 */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setSeatingFillOrder(seatingFillOrder === 'col' ? 'row' : 'col')}
                  title={seatingFillOrder === 'col' ? '目前為：直排號碼向下 (1~5, 6~10)' : '目前為：橫排號碼向右 (1~6, 7~12)'}
                  className="px-2 py-1 rounded-lg font-bold text-slate-700 hover:bg-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowDownUp className="w-3 h-3 text-slate-500" />
                  <span>{seatingFillOrder === 'col' ? '縱向排號(直排)' : '橫向排號(橫排)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* List View Quick Filters */}
          {viewMode === 'grid' && (
            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                全部 ({sortedStudents.length})
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'pending'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                缺交
              </button>
              <button
                onClick={() => setFilterMode('need-fix')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'need-fix'
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                需訂正
              </button>
              <button
                onClick={() => setFilterMode('completed')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'completed'
                    ? 'bg-blue-700 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                已交
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-normal">狀態說明：</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-slate-100 flex items-center justify-center text-[9px] text-slate-600 font-bold">○</span>
            <span>缺交 / 未交</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">✓</span>
            <span className="text-blue-700 font-bold">已交</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-[9px] text-white font-bold">!</span>
            <span className="text-rose-700 font-bold">需訂正</span>
          </div>
          {viewMode === 'seating' && (
            <span className="ml-auto text-[11px] text-slate-500 hidden md:inline">
              {seatingPerspective === 'teacher'
                ? `👨‍🏫 講台視角（講台在${podiumPosition === 'bottom' ? '下方·老師站位' : '上方'}）`
                : `🧑‍🎓 學生視角（講台在${podiumPosition === 'top' ? '上方·黑板前' : '下方'}）`}
            </span>
          )}
        </div>
      </div>

      {/* 2. MAIN DISPLAY: SEATING CHART VIEW vs LIST VIEW */}
      {viewMode === 'seating' ? (
        /* ================= SEATING CHART VIEW ================= */
        <div className="bg-slate-50/80 p-3 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs mb-3">
          {/* Seating Adjustment Mode Banner */}
          {isAdjustingSeats && (
            <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl text-xs shadow-xs animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">座位調整模式（對調/換位）</h4>
                    <p className="text-amber-800 text-[11px]">
                      點選第一位學生（發光選取）➔ 再點選另一位學生或空位，兩者即刻對調！完成後點右側「完成調整」。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToDefaultSeats}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>重設為預設順序</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdjustingSeats(false);
                      setSelectedDesk(null);
                    }}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    ✓ 完成調整
                  </button>
                </div>
              </div>

              {adjustFeedback && (
                <div className="mt-2 text-xs font-bold text-amber-950 bg-amber-200/60 p-1.5 rounded-lg">
                  {adjustFeedback}
                </div>
              )}
            </div>
          )}

          {/* Top Banner: Podium if top, Classroom Back if bottom */}
          {podiumPosition === 'top' ? renderPodiumBanner() : renderClassroomBackBanner()}

          {/* Desks Matrix */}
          <div className="space-y-3 sm:space-y-4 my-2">
            {seatingGrid.map((rowCells, rowIdx) => {
              const rowPhysicalIdx = rowCells[0]?.physicalRow ?? (podiumPosition === 'bottom' ? rows - 1 - rowIdx : rowIdx);
              return (
                <div key={rowIdx} className="relative">
                  {/* Row label badge */}
                  <div className="text-[11px] text-slate-500 font-bold mb-1 pl-1 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px]">
                      第 {rowPhysicalIdx + 1} 列
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {rowPhysicalIdx === 0
                        ? '(最前排·靠近講台)'
                        : rowPhysicalIdx === rows - 1
                        ? '(最後排·靠後門)'
                        : ''}
                    </span>
                  </div>

                  <div 
                    className="grid gap-2 sm:gap-3.5"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {rowCells.map(({ deskIndex, student }, colIdx) => {
                      if (student) {
                        return renderStudentSeatButton(student, true, deskIndex);
                      }
                      // Empty desk placeholder
                      const isSelectedEmpty = isAdjustingSeats && selectedDesk?.deskIndex === deskIndex;
                      return (
                        <div
                          key={`empty_${deskIndex}`}
                          onClick={() => {
                            if (isAdjustingSeats) {
                              handleDeskClickInAdjustMode(deskIndex, null);
                            }
                          }}
                          className={`w-full min-h-[100px] sm:min-h-[115px] p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center select-none ${
                            isAdjustingSeats 
                              ? isSelectedEmpty
                                ? 'border-amber-500 bg-amber-100 ring-4 ring-amber-400 scale-105 z-20 cursor-pointer shadow-md'
                                : 'border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 bg-white/70 cursor-pointer'
                              : 'border-dashed border-slate-300/80 bg-white/40 text-slate-300'
                          }`}
                        >
                          <span className="text-xl">{isAdjustingSeats ? '📥' : '🪑'}</span>
                          <span className={`text-[10px] font-bold mt-1 ${isAdjustingSeats ? 'text-amber-800' : 'text-slate-400'}`}>
                            {isAdjustingSeats ? (isSelectedEmpty ? '已選取空位' : '空位(點此換至此)') : '空位'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Banner: Classroom Back if top, Podium if bottom */}
          {podiumPosition === 'top' ? renderClassroomBackBanner() : renderPodiumBanner()}
        </div>
      ) : (
        /* ================= LIST VIEW (ENLARGED FONTS & FEWER COLUMNS) ================= */
        filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500 text-sm">目前沒有符合此篩選條件的學生座號</p>
            <button
              onClick={() => setFilterMode('all')}
              className="mt-2 text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              切換回顯示全部座號
            </button>
          </div>
        ) : (
          /* Reduced columns per row: 3 on mobile, 4 on sm, 5 on md, 6 on lg (larger buttons & fonts!) */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-4 mb-3">
            {filteredStudents.map((student) => renderStudentSeatButton(student, false))}
          </div>
        )
      )}

      {/* 3. STATS & PROGRESS BAR (統計與進度列 - 位於座號正下方) */}
      {statsBar && (
        <div className="mt-3 mb-3">
          {statsBar}
        </div>
      )}

      {/* 4. INTUITIVE CLICK MODE SELECTOR (直覺點法工具列 - 位於統計列下方) */}
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
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
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
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
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
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              clickMode === 'stamp-completed'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold ring-2 ring-blue-600/20'
                : 'bg-blue-50/60 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>🔵 已交筆刷</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'stamp-completed' ? 'text-blue-100' : 'text-blue-500'}`}>
              連續點擊連續標記已交
            </span>
          </button>

          {/* 3-State Cycle */}
          <button
            type="button"
            onClick={() => setClickMode('cycle')}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              clickMode === 'cycle'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold ring-2 ring-indigo-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-semibold">
              <Repeat className="w-3.5 h-3.5" />
              <span>三態循環點擊</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${clickMode === 'cycle' ? 'text-indigo-100' : 'text-slate-400'}`}>
              未交 ➔ 已交 ➔ 需訂正 ➔ 循環
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
