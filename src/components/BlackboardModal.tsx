import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Filter, 
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import { 
  ClassRecord, 
  AssignmentRecord, 
  StudentRecord, 
  SubmissionStatus, 
  StatusType 
} from '../types';

interface BlackboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass?: ClassRecord;
  students: StudentRecord[];
  assignments: AssignmentRecord[];
  statuses: SubmissionStatus[];
  onSetStudentStatus?: (studentId: string, status: StatusType) => void;
}

export type BlackboardFontSize = 'normal' | 'large' | 'huge' | 'giant';

interface FontSizeConfig {
  fontSize: string;
  fontPixelSize: number;
  lineHeight: string;
  columnGap: string;
  subColumnGap: string;
  letterSpacing: string;
}

const FONT_SIZE_CONFIGS: Record<BlackboardFontSize, FontSizeConfig> = {
  normal: {
    fontSize: '40px',
    fontPixelSize: 40,
    lineHeight: '1.45',
    columnGap: '48px',
    subColumnGap: '24px',
    letterSpacing: '0.07em',
  },
  large: {
    fontSize: '52px',
    fontPixelSize: 52,
    lineHeight: '1.45',
    columnGap: '58px',
    subColumnGap: '28px',
    letterSpacing: '0.08em',
  },
  huge: {
    fontSize: '66px',
    fontPixelSize: 66,
    lineHeight: '1.44',
    columnGap: '68px',
    subColumnGap: '32px',
    letterSpacing: '0.09em',
  },
  giant: {
    fontSize: '82px',
    fontPixelSize: 82,
    lineHeight: '1.42',
    columnGap: '80px',
    subColumnGap: '38px',
    letterSpacing: '0.10em',
  },
};

/**
 * Render assignment title with upright horizontal alphanumeric tokens and clean dashes
 */
function renderTitle(title: string): React.ReactNode[] {
  const regex = /([A-Za-z0-9]{1,4}|[\-\~－])/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(title)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`txt_${lastIndex}`}>{title.substring(lastIndex, match.index)}</span>
      );
    }
    const m = match[0];
    const key = `token_${match.index}`;
    if (m === '-' || m === '~' || m === '－') {
      nodes.push(<span key={key} className="inline-block">－</span>);
    } else {
      nodes.push(
        <span
          key={key}
          className="tate-chu-yoko font-black"
          style={{
            WebkitTextCombine: 'horizontal',
            textCombineUpright: 'all',
          }}
        >
          {m}
        </span>
      );
    }
    lastIndex = match.index + m.length;
  }

  if (lastIndex < title.length) {
    nodes.push(<span key={`txt_${lastIndex}`}>{title.substring(lastIndex)}</span>);
  }

  return nodes;
}

interface StudentTokenItem {
  id: string;
  studentId: string;
  seatNumber: number;
  name: string;
  isNeedFix?: boolean;
  isLastOverall: boolean;
}

interface AssignmentColumnGroupProps {
  assignment: AssignmentRecord;
  missingStudents: StudentRecord[];
  needFixStudents: StudentRecord[];
  showNeedFix: boolean;
  isFullySubmitted: boolean;
  fontConfig: FontSizeConfig;
  effectiveMaxHeight: number;
  onQuickSubmit?: (assignmentId: string, studentId: string) => void;
}

/**
 * AssignmentColumnGroup
 * 100% 依據用戶圖一 (image_e5215cfd.png) 之直式板書排版：
 * - 每一欄皆為純直式書寫流（writing-mode: vertical-rl; text-orientation: upright;），絕不使用 flex-col 造成橫向擴散！
 * - Column 1：頂部為【作業標題】：，下方垂直列出座號與頓號（12、13、14、15）
 * - 座號換行時（Column 2）：頂部為與標題等高的隱形 Spacer（visibility: hidden），讓第二行第一個座號（如 16）直接從冒號左側接續，高度完全對齊冒號後的第一個數字（如 12）！
 * - 全部座號結尾必定以全形中文句號「。」作結！
 */
const AssignmentColumnGroup: React.FC<AssignmentColumnGroupProps> = ({
  assignment,
  missingStudents,
  needFixStudents,
  showNeedFix,
  isFullySubmitted,
  fontConfig,
  effectiveMaxHeight,
  onQuickSubmit,
}) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [measuredTitleHeight, setMeasuredTitleHeight] = useState<number>(0);

  // Measure title + colon height in DOM for precise token budgeting
  useLayoutEffect(() => {
    if (titleRef.current) {
      const h = titleRef.current.offsetHeight;
      if (h > 0 && Math.abs(h - measuredTitleHeight) > 1) {
        setMeasuredTitleHeight(h);
      }
    }
  }, [assignment.title, fontConfig.fontSize]);

  const fallbackTitleHeight = Math.round((assignment.title.length + 1) * fontConfig.fontPixelSize * 1.12);
  const titleHeight = measuredTitleHeight > 0 ? measuredTitleHeight : fallbackTitleHeight;

  // In vertical text, 1 student item = seat number (1em) + punctuation (1em) + line/letter spacing (~2.15 ems)
  const tokenHeight = Math.round(fontConfig.fontPixelSize * 2.15);

  // Build the list of student tokens
  const tokens: StudentTokenItem[] = [];

  missingStudents.forEach((student, idx) => {
    const isLastMissing = idx === missingStudents.length - 1;
    const hasNeedFix = showNeedFix && needFixStudents.length > 0;
    tokens.push({
      id: `missing_${student.id}`,
      studentId: student.id,
      seatNumber: student.seatNumber,
      name: student.name,
      isNeedFix: false,
      isLastOverall: isLastMissing && !hasNeedFix,
    });
  });

  if (showNeedFix && needFixStudents.length > 0) {
    needFixStudents.forEach((student, idx) => {
      const isLastFix = idx === needFixStudents.length - 1;
      tokens.push({
        id: `fix_${student.id}`,
        studentId: student.id,
        seatNumber: student.seatNumber,
        name: student.name,
        isNeedFix: true,
        isLastOverall: isLastFix,
      });
    });
  }

  // Calculate capacities for Column 1 vs Continuation Columns
  // Col 1 available space = effectiveMaxHeight - titleHeight
  const col1AvailableSpace = Math.max(tokenHeight, effectiveMaxHeight - titleHeight);
  const col1Capacity = Math.max(1, Math.floor(col1AvailableSpace / tokenHeight));

  // Continuation columns also start indented at titleHeight, so available space is the same
  const contAvailableSpace = Math.max(tokenHeight, effectiveMaxHeight - titleHeight);
  const contCapacity = Math.max(1, Math.floor(contAvailableSpace / tokenHeight));

  // Partition tokens into columns
  const col1Tokens = tokens.slice(0, col1Capacity);
  const remainingTokens = tokens.slice(col1Capacity);

  const continuationColumns: StudentTokenItem[][] = [];
  let curr = remainingTokens;
  while (curr.length > 0) {
    continuationColumns.push(curr.slice(0, contCapacity));
    curr = curr.slice(contCapacity);
  }

  return (
    <div 
      className="flex flex-row-reverse items-start shrink-0"
      style={{
        gap: fontConfig.subColumnGap,
        maxHeight: `${effectiveMaxHeight}px`,
      }}
    >
      {/* 
        Column 1: Main Column (Right column of this assignment)
        - 直式由上往下自然排版：【作業名稱】：12、13、14、15
      */}
      <div
        className="shrink-0 select-none text-[#faf8ea]"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
          fontSize: fontConfig.fontSize,
          lineHeight: fontConfig.lineHeight,
          letterSpacing: fontConfig.letterSpacing,
        }}
      >
        {/* Title + Colon */}
        <span ref={titleRef} className="font-black">
          {renderTitle(assignment.title)}：
        </span>

        {/* First batch of students or fully submitted tag */}
        {isFullySubmitted ? (
          <span className="font-bold text-emerald-300">
            全交 ✓
          </span>
        ) : (
          col1Tokens.map((token, idx) => (
            <React.Fragment key={token.id}>
              {token.isNeedFix && (idx === 0 || !col1Tokens[idx - 1]?.isNeedFix) && (
                <span className="font-bold text-rose-300 text-[0.85em]">（需訂正</span>
              )}
              <span
                onClick={() => onQuickSubmit?.(assignment.id, token.studentId)}
                title={`點擊標記【${token.seatNumber} 號 ${token.name}】為已完成`}
                className={`tate-chu-yoko font-black cursor-pointer transition-colors ${
                  token.isNeedFix 
                    ? 'text-rose-300 hover:text-amber-200' 
                    : 'text-[#faf8ea] hover:text-amber-300'
                }`}
                style={{
                  WebkitTextCombine: 'horizontal',
                  textCombineUpright: 'all',
                }}
              >
                {token.seatNumber}
              </span>
              <span className={`font-black ${token.isNeedFix ? 'text-rose-300' : 'text-[#faf8ea]'}`}>
                {token.isLastOverall ? '。' : '、'}
              </span>
              {token.isNeedFix && token.isLastOverall && (
                <span className="font-bold text-rose-300 text-[0.85em]">）</span>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* 
        Continuation Columns (Column 2, Column 3... placed to the left)
        - 頂部為與 Column 1 標題等高的隱形 Spacer (visibility: hidden)
        - 讓換行座號（如 16、17、18）從冒號左側開始排列，完全對齊冒號後第一個數字（如 12）！
      */}
      {continuationColumns.map((colTokens, colIdx) => (
        <div
          key={`cont_col_${colIdx}`}
          className="shrink-0 select-none text-[#faf8ea]"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            fontSize: fontConfig.fontSize,
            lineHeight: fontConfig.lineHeight,
            letterSpacing: fontConfig.letterSpacing,
          }}
        >
          {/* Invisible Title Spacer: Guaranteed 100% exact same vertical height as Column 1 title! */}
          <span 
            className="font-black invisible pointer-events-none" 
            aria-hidden="true"
          >
            {renderTitle(assignment.title)}：
          </span>

          {/* Continuation students */}
          {colTokens.map((token, tokenIdx) => (
            <React.Fragment key={token.id}>
              {token.isNeedFix && tokenIdx === 0 && (
                <span className="font-bold text-rose-300 text-[0.85em]">（需訂正</span>
              )}
              <span
                onClick={() => onQuickSubmit?.(assignment.id, token.studentId)}
                title={`點擊標記【${token.seatNumber} 號 ${token.name}】為已完成`}
                className={`tate-chu-yoko font-black cursor-pointer transition-colors ${
                  token.isNeedFix 
                    ? 'text-rose-300 hover:text-amber-200' 
                    : 'text-[#faf8ea] hover:text-amber-300'
                }`}
                style={{
                  WebkitTextCombine: 'horizontal',
                  textCombineUpright: 'all',
                }}
              >
                {token.seatNumber}
              </span>
              <span className={`font-black ${token.isNeedFix ? 'text-rose-300' : 'text-[#faf8ea]'}`}>
                {token.isLastOverall ? '。' : '、'}
              </span>
              {token.isNeedFix && token.isLastOverall && (
                <span className="font-bold text-rose-300 text-[0.85em]">）</span>
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export const BlackboardModal: React.FC<BlackboardModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  students,
  assignments,
  statuses,
  onSetStudentStatus,
}) => {
  // Font Size: 'normal' (40px) | 'large' (52px - default) | 'huge' (66px) | 'giant' (82px)
  const [fontSize, setFontSize] = useState<BlackboardFontSize>(() => {
    return (localStorage.getItem('checkhw_bb_fontsize') as BlackboardFontSize) || 'large';
  });

  // Display Filters: only show assignments with missing homework by default
  const [onlyMissing, setOnlyMissing] = useState<boolean>(() => {
    const saved = localStorage.getItem('checkhw_bb_only_missing');
    return saved !== null ? saved === 'true' : true;
  });

  const [showNeedFix, setShowNeedFix] = useState<boolean>(() => {
    const saved = localStorage.getItem('checkhw_bb_show_need_fix');
    return saved !== null ? saved === 'true' : false;
  });

  const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<string>('');
  const [boardHeight, setBoardHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);

  const boardRef = useRef<HTMLDivElement>(null);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('checkhw_bb_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('checkhw_bb_only_missing', String(onlyMissing));
  }, [onlyMissing]);

  useEffect(() => {
    localStorage.setItem('checkhw_bb_show_need_fix', String(showNeedFix));
  }, [showNeedFix]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update boardHeight on window resize or toolbar toggle
  useEffect(() => {
    const updateHeight = () => {
      if (boardRef.current) {
        setBoardHeight(boardRef.current.clientHeight);
      } else if (typeof window !== 'undefined') {
        setBoardHeight(window.innerHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isToolbarVisible, isOpen]);

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter students belonging to activeClass
  const classStudents = students
    .filter((s) => s.classId === activeClass?.id && s.isActive)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  // Filter unarchived assignments for activeClass
  const classAssignments = assignments
    .filter((a) => a.classId === activeClass?.id && !a.isArchived)
    .sort((a, b) => b.createdAt - a.createdAt);

  // Status mapping
  const statusLookup = new Map<string, StatusType>();
  statuses.forEach((s) => {
    statusLookup.set(`${s.assignmentId}_${s.studentId}`, s.status);
  });

  // Calculate missing info per assignment
  interface AssignmentReport {
    assignment: AssignmentRecord;
    missingStudents: StudentRecord[];
    needFixStudents: StudentRecord[];
    completedCount: number;
    totalCount: number;
    isFullySubmitted: boolean;
  }

  const reports: AssignmentReport[] = classAssignments.map((assignment) => {
    const missingStudents: StudentRecord[] = [];
    const needFixStudents: StudentRecord[] = [];
    let completedCount = 0;

    classStudents.forEach((student) => {
      const status = statusLookup.get(`${assignment.id}_${student.id}`) || 'pending';
      if (status === 'completed') {
        completedCount++;
      } else if (status === 'need-fix') {
        needFixStudents.push(student);
      } else {
        missingStudents.push(student);
      }
    });

    const isFullySubmitted = missingStudents.length === 0 && (showNeedFix ? needFixStudents.length === 0 : true);

    return {
      assignment,
      missingStudents,
      needFixStudents,
      completedCount,
      totalCount: classStudents.length,
      isFullySubmitted,
    };
  });

  // Filter displayed assignments: only missing (default) or all
  const displayReports = onlyMissing ? reports.filter((r) => !r.isFullySubmitted) : reports;

  // On open or data change, scroll canvas to far right so Column 1 is immediately in view
  useEffect(() => {
    if (isOpen && boardRef.current) {
      const timer = setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.scrollLeft = boardRef.current.scrollWidth;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, displayReports.length, fontSize]);

  if (!isOpen) return null;

  // Toggle true Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // ignore
      }
    }
  };

  const fontConfig = FONT_SIZE_CONFIGS[fontSize] || FONT_SIZE_CONFIGS.large;

  // Calculate effective max height for columns to guarantee comfortable top & bottom margins
  const topPaddingPx = isToolbarVisible ? 16 : 28;
  const bottomMarginPx = 56;
  const effectiveMaxHeight = Math.max(260, boardHeight - topPaddingPx - bottomMarginPx);

  // One-click Copy Text Summary (純座號格式，句號結尾)
  const handleCopyTextSummary = () => {
    if (reports.length === 0) return;
    triggerHaptic();

    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const lines: string[] = [];
    lines.push(`🏫【${activeClass?.name || '班級'} 作業缺交登記榜】`);
    lines.push(`📅 日期：${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} (週${weekDays[now.getDay()]})`);
    lines.push('--------------------------------');

    if (displayReports.length === 0) {
      lines.push('🎉 全班今日所有作業已全數繳齊！');
    } else {
      displayReports.forEach((r) => {
        if (r.missingStudents.length === 0 && r.needFixStudents.length === 0) {
          lines.push(`${r.assignment.title}：全交 ✓`);
        } else {
          const parts: string[] = [];
          if (r.missingStudents.length > 0) {
            const seats = r.missingStudents.map((s) => s.seatNumber).join('、');
            parts.push(`${r.assignment.title}：${seats}。`);
          }
          if (r.needFixStudents.length > 0 && showNeedFix) {
            const fixSeats = r.needFixStudents.map((s) => s.seatNumber).join('、');
            parts.push(`  (需訂正：${fixSeats}。)`);
          }
          lines.push(parts.join(' '));
        }
      });
    }

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedNotice('✓ 已複製黑板缺交名單！');
      setTimeout(() => setCopiedNotice(''), 3000);
    });
  };

  // Quick mark student as completed directly on blackboard!
  const handleQuickMarkSubmitted = (assignmentId: string, studentId: string) => {
    if (!onSetStudentStatus) return;
    triggerHaptic();
    onSetStudentStatus(studentId, 'completed');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: '#385345',
        backgroundImage: `
          radial-gradient(ellipse at 50% 50%, rgba(68, 97, 81, 0.28) 0%, rgba(28, 46, 36, 0.88) 100%),
          url('/chalkboard-texture.png')
        `,
        backgroundSize: 'cover, 800px 800px',
        backgroundRepeat: 'no-repeat, repeat',
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.7)',
      }}
    >
      {/* Global CSS to guarantee tate-chu-yoko text combination */}
      <style>{`
        .tate-chu-yoko {
          -webkit-text-combine: horizontal;
          -ms-text-combine-horizontal: all;
          text-combine-upright: all;
          display: inline !important;
          vertical-align: baseline;
        }
      `}</style>

      {/* 
        Floating Toolbar Header (可一鍵摺疊進入純黑板模式)
        - 隱藏時高度完全折疊為 0 (max-h-0 overflow-hidden)，不再占用版面高度！
        - 黑板內容會順暢上移，避免上方產生過大留白
      */}
      <div 
        className={`z-40 transition-all duration-300 ease-in-out overflow-hidden ${
          isToolbarVisible 
            ? 'max-h-24 opacity-100 border-b-2 border-[#2f4f3c]' 
            : 'max-h-0 opacity-0 pointer-events-none border-b-0'
        }`}
      >
        <div className="bg-[#1f3327]/90 backdrop-blur-md px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xl text-xs sm:text-sm text-[#f5f3e6]">
          {/* Left info badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#274232] font-bold text-amber-200 border border-[#3e634e]">
              🏫 {activeClass?.name || '班級'} 黑板登記榜
            </span>
            <span className="text-emerald-200/80 text-xs hidden md:inline">
              直式中文由右至左 · 數字英文自動橫排 · 折行對齊冒號 · 句號結尾
            </span>
          </div>

          {/* Controls: Font Size, Filter & Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Font Size Selector */}
            <div className="flex items-center bg-[#17281f] p-1 rounded-xl border border-[#2b4837]">
              <span className="text-[11px] font-bold text-emerald-300/80 px-1.5 hidden lg:inline">字體大小：</span>
              {(['normal', 'large', 'huge', 'giant'] as BlackboardFontSize[]).map((sizeKey) => {
                const labels: Record<BlackboardFontSize, string> = {
                  normal: '標準',
                  large: '大字',
                  huge: '特大',
                  giant: '超大·遠距',
                };
                return (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() => setFontSize(sizeKey)}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fontSize === sizeKey
                        ? 'bg-amber-300 text-slate-950 font-black shadow-xs scale-105'
                        : 'text-emerald-200/70 hover:text-white hover:bg-[#253f30]'
                    }`}
                  >
                    {labels[sizeKey]}
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle: Only Missing vs All */}
            <button
              type="button"
              onClick={() => setOnlyMissing(!onlyMissing)}
              title={onlyMissing ? '目前僅顯示有欠交之作業' : '目前顯示全部作業'}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                onlyMissing
                  ? 'bg-amber-400/20 text-amber-200 border-amber-400/50'
                  : 'bg-[#17281f] text-emerald-200/70 border-[#2b4837]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{onlyMissing ? '僅欠交作業' : '全部作業'}</span>
            </button>

            {/* Need-Fix Toggle */}
            <button
              type="button"
              onClick={() => setShowNeedFix(!showNeedFix)}
              title={showNeedFix ? '包含需訂正座號' : '僅顯示缺交'}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showNeedFix
                  ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                  : 'bg-[#17281f] text-emerald-200/70 border-[#2b4837]'
              }`}
            >
              <span>{showNeedFix ? '✓ 含需訂正' : '不含訂正'}</span>
            </button>
          </div>

          {/* Right tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTextSummary}
              title="複製文字版缺交名單"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#264433] hover:bg-[#315741] text-emerald-200 border border-[#3e684e] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">複製文字</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? '結束全螢幕' : '全螢幕大螢幕投影 (F11)'}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 border ${
                isFullscreen
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-white border-emerald-500/60'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? '結束全螢幕' : '全螢幕投影'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsToolbarVisible(false)}
              title="隱藏頂部工具列（進入純黑板模式，文字自動上移）"
              className="px-2 py-1 rounded-xl text-xs font-bold bg-[#17281f] text-emerald-200/80 hover:text-white border border-[#2b4837] transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden md:inline">純黑板</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="關閉黑板頁面 (返回作業清點)"
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-rose-900/60 rounded-xl border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button to restore toolbar when hidden */}
      {!isToolbarVisible && (
        <button
          type="button"
          onClick={() => setIsToolbarVisible(true)}
          title="顯示工具列與設定"
          className="fixed top-4 right-5 z-50 px-3.5 py-1.5 rounded-xl bg-[#1f3327]/85 hover:bg-[#1f3327] text-amber-200 border border-[#3e634e] text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs cursor-pointer transition-all active:scale-95 animate-in fade-in"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>工具列</span>
        </button>
      )}

      {/* Copied Notification Toast */}
      {copiedNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl shadow-2xl border-2 border-amber-400 text-sm animate-in fade-in zoom-in-95">
          {copiedNotice}
        </div>
      )}

      {/* 
        Main Blackboard Canvas
        - 100% 依據圖一 (image_e5215cfd.png) 純直式排版
        - 留有充足底部與頂部邊界 (pb-14)，絕無任何字體被吃掉或被切半
        - 工具列隱藏時順暢上移 (pt-6 sm:pt-8)，版面自然優美
        - 每項作業各自獨立直行，欠交座號過多時自動換至左側下一行
        - 換行時，以冒號後方第一個數字為基準對齊（Hanging Indent Spacer）
        - 所有座號結束以中文句號「。」作結
      */}
      <main 
        ref={boardRef}
        className={`flex-1 overflow-x-auto overflow-y-hidden flex flex-row-reverse justify-start items-start select-none transition-all duration-300 ${
          isToolbarVisible ? 'pt-4 sm:pt-6' : 'pt-6 sm:pt-8'
        } pb-14 px-8 sm:px-12 md:px-16`}
        style={{
          direction: 'ltr',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif',
          color: '#faf8ea', // Authentic warm chalk cream white matching image_a968f794.png
          textShadow: '0 0 1px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.8)',
          gap: fontConfig.columnGap,
        }}
      >
        {classAssignments.length === 0 ? (
          <div 
            className="h-full flex items-center justify-center text-center p-8 text-emerald-200/80 font-bold"
            style={{ writingMode: 'vertical-rl', fontSize: fontConfig.fontSize }}
          >
            目前本班尚無登記任何作業
          </div>
        ) : displayReports.length === 0 ? (
          /* Celebratory All Completed Notice */
          <div 
            className="h-full flex flex-col justify-center items-center py-8 px-12 text-center animate-in fade-in"
            style={{ writingMode: 'vertical-rl', fontSize: fontConfig.fontSize, lineHeight: 1.6 }}
          >
            <div className="font-black text-amber-200 tracking-widest drop-shadow-md">
              🎉 太棒了！今日所有作業全數繳齊！
            </div>
            <div className="text-emerald-200 text-2xl font-bold mt-4 tracking-wider">
              全體同學無缺交，表現優良！
            </div>
          </div>
        ) : (
          displayReports.map((report) => (
            <AssignmentColumnGroup
              key={report.assignment.id}
              assignment={report.assignment}
              missingStudents={report.missingStudents}
              needFixStudents={report.needFixStudents}
              showNeedFix={showNeedFix}
              isFullySubmitted={report.isFullySubmitted}
              fontConfig={fontConfig}
              effectiveMaxHeight={effectiveMaxHeight}
              onQuickSubmit={handleQuickMarkSubmitted}
            />
          ))
        )}
      </main>
    </div>
  );
};
