import { SummaryFormat, SubmissionStatus, StudentRecord, ClassRecord, AssignmentRecord } from '../types';

export interface SummaryStats {
  total: number;
  completed: number;
  pending: number;
  needFix: number;
  completedPercent: number;
  pendingSeats: number[];
  needFixSeats: number[];
  completedSeats: number[];
}

export function calculateStats(
  students: StudentRecord[],
  statuses: SubmissionStatus[],
  assignmentId: string
): SummaryStats {
  const activeStudents = students.filter((s) => s.isActive);
  const statusMap = new Map<string, string>();

  statuses
    .filter((st) => st.assignmentId === assignmentId)
    .forEach((st) => {
      statusMap.set(st.studentId, st.status);
    });

  const pendingSeats: number[] = [];
  const needFixSeats: number[] = [];
  const completedSeats: number[] = [];

  activeStudents.forEach((st) => {
    const s = statusMap.get(st.id) || 'pending';
    if (s === 'completed') {
      completedSeats.push(st.seatNumber);
    } else if (s === 'need-fix') {
      needFixSeats.push(st.seatNumber);
    } else {
      pendingSeats.push(st.seatNumber);
    }
  });

  // Strict numeric sorting
  pendingSeats.sort((a, b) => a - b);
  needFixSeats.sort((a, b) => a - b);
  completedSeats.sort((a, b) => a - b);

  const total = activeStudents.length;
  const completed = completedSeats.length;
  const pending = pendingSeats.length;
  const needFix = needFixSeats.length;
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    needFix,
    completedPercent,
    pendingSeats,
    needFixSeats,
    completedSeats,
  };
}

export function formatSeatList(seats: number[]): string {
  if (seats.length === 0) return '無';
  return seats.map((s) => `${s} 號`).join('、');
}

export function generateSummaryText(
  format: SummaryFormat,
  cls: ClassRecord,
  assignment: AssignmentRecord,
  stats: SummaryStats,
  pendingTerm: '缺交' | '未交' = '缺交'
): string {
  const pendingStr = formatSeatList(stats.pendingSeats);
  const needFixStr = formatSeatList(stats.needFixSeats);

  switch (format) {
    case 'compact':
      return `【${cls.name}】${assignment.title}（${assignment.date}）\n` +
        `${pendingTerm}：${pendingStr}；需訂正：${needFixStr}（全班 ${stats.total} 人，已交 ${stats.completed} 人）`;

    case 'pending-only':
      return `【${cls.name}】${assignment.title} - ${pendingTerm}名單\n` +
        `座號：${pendingStr}（共 ${stats.pending} 人）`;

    case 'need-fix-only':
      return `【${cls.name}】${assignment.title} - 需訂正名單\n` +
        `座號：${needFixStr}（共 ${stats.needFix} 人）`;

    case 'detailed':
    default: {
      const isAllDone = stats.pending === 0 && stats.needFix === 0;
      let body = `【${assignment.title} 作業繳交報告】\n` +
        `班級：${cls.name}\n` +
        `日期：${assignment.date}\n` +
        `進度：全班 ${stats.total} 人｜已交 ${stats.completed} 人｜${pendingTerm} ${stats.pending} 人｜需訂正 ${stats.needFix} 人（完成率 ${stats.completedPercent}%）\n\n`;

      if (isAllDone) {
        body += `🎉 全班皆已完成繳交！讚！`;
      } else {
        body += `❌ ${pendingTerm}名單（${stats.pending}人）：${pendingStr}\n` +
          `⚠️ 需訂正（${stats.needFix}人）：${needFixStr}\n` +
          `✅ 已交：${stats.pendingSeats.length === 0 ? '全體同學均已繳交' : '其餘同學已繳交'}`;
      }
      return body;
    }
  }
}

export function exportAssignmentCSV(
  cls: ClassRecord,
  assignment: AssignmentRecord,
  students: StudentRecord[],
  statuses: SubmissionStatus[]
): string {
  const activeStudents = students
    .filter((s) => s.isActive)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  const statusMap = new Map<string, string>();
  statuses
    .filter((st) => st.assignmentId === assignment.id)
    .forEach((st) => statusMap.set(st.studentId, st.status));

  const rows = [
    ['班級', cls.name],
    ['作業名稱', assignment.title],
    ['日期', assignment.date],
    [''],
    ['座號', '姓名', '繳交狀態', '狀態代碼'],
  ];

  const statusLabels: Record<string, string> = {
    pending: '未交',
    completed: '已交',
    'need-fix': '需訂正',
  };

  activeStudents.forEach((student) => {
    const rawStatus = statusMap.get(student.id) || 'pending';
    const label = statusLabels[rawStatus] || '未交';
    rows.push([
      String(student.seatNumber),
      student.name || `學生${student.seatNumber}`,
      label,
      rawStatus,
    ]);
  });

  return rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
}
