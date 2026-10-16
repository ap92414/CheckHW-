import { AppData, ClassRecord, StudentRecord, AssignmentRecord, SubmissionStatus, StatusType, HistoryAction } from '../types';

const STORAGE_KEY = 'checkhw_classroom_data_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateInitialData(): AppData {
  const initialClassId = 'class_default_701';
  const initialClass: ClassRecord = {
    id: initialClassId,
    name: '七年級 1 班',
    studentCount: 30,
    createdAt: Date.now(),
  };

  const students: StudentRecord[] = [];
  for (let i = 1; i <= 30; i++) {
    students.push({
      id: `student_${initialClassId}_${i}`,
      classId: initialClassId,
      seatNumber: i,
      name: '',
      isActive: true,
    });
  }

  const todayStr = getTodayDateString();
  const assignment1: AssignmentRecord = {
    id: 'asg_math_01',
    classId: initialClassId,
    title: '數學講義 3-2 隨堂測驗',
    date: todayStr,
    isArchived: false,
    createdAt: Date.now() - 3600000,
  };

  const assignment2: AssignmentRecord = {
    id: 'asg_chinese_01',
    classId: initialClassId,
    title: '國文習作 第五課 (全)',
    date: todayStr,
    isArchived: false,
    createdAt: Date.now() - 7200000,
  };

  // Seed some realistic sample statuses for math assignment
  const statuses: SubmissionStatus[] = [];
  students.forEach((s) => {
    let st: StatusType = 'completed';
    // Let seats 5, 12, 23 be pending, seats 3, 18 be need-fix
    if ([5, 12, 23].includes(s.seatNumber)) {
      st = 'pending';
    } else if ([3, 18].includes(s.seatNumber)) {
      st = 'need-fix';
    }

    statuses.push({
      id: `${assignment1.id}_${s.id}`,
      assignmentId: assignment1.id,
      studentId: s.id,
      seatNumber: s.seatNumber,
      status: st,
      updatedAt: Date.now(),
    });

    // Chinese assignment defaults mostly pending
    statuses.push({
      id: `${assignment2.id}_${s.id}`,
      assignmentId: assignment2.id,
      studentId: s.id,
      seatNumber: s.seatNumber,
      status: 'pending',
      updatedAt: Date.now(),
    });
  });

  return {
    version: 1,
    classes: [initialClass],
    students,
    assignments: [assignment1, assignment2],
    statuses,
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.classes || !parsed.students || !parsed.assignments || !parsed.statuses) {
      throw new Error('Invalid structure');
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to parse localStorage data, resetting to initial data', err);
    const initial = generateInitialData();
    saveAppData(initial);
    return initial;
  }
}

export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Storage quota exceeded or storage error:', err);
    return false;
  }
}

export function getNextStatus(current: StatusType): StatusType {
  switch (current) {
    case 'pending':
      return 'completed';
    case 'completed':
      return 'need-fix';
    case 'need-fix':
      return 'pending';
    default:
      return 'pending';
  }
}

export function validateImportData(obj: unknown): { valid: boolean; error?: string; data?: AppData } {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: '檔案格式不是有效的 JSON 物件' };
  }
  const candidate = obj as Partial<AppData>;
  if (!Array.isArray(candidate.classes) || !Array.isArray(candidate.students) || 
      !Array.isArray(candidate.assignments) || !Array.isArray(candidate.statuses)) {
    return { valid: false, error: '資料缺少必要的資料表結構 (classes, students, assignments, statuses)' };
  }
  if (candidate.classes.length === 0) {
    return { valid: false, error: '班級清單為空，請確認檔案來源' };
  }
  return {
    valid: true,
    data: {
      version: candidate.version || 1,
      classes: candidate.classes,
      students: candidate.students,
      assignments: candidate.assignments,
      statuses: candidate.statuses,
    },
  };
}
