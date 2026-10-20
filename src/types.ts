export type StatusType = 'pending' | 'completed' | 'need-fix';

export interface StudentRecord {
  id: string;
  classId: string;
  seatNumber: number;
  name: string;
  isActive: boolean; // false if 缺號/轉出
  deskIndex?: number; // 0-based custom classroom desk index
}

export interface ClassRecord {
  id: string;
  name: string;
  studentCount: number;
  createdAt: number;
  seatingColumns?: number;
  seatingFillOrder?: 'col' | 'row';
}

export interface AssignmentRecord {
  id: string;
  classId: string;
  title: string;
  date: string; // YYYY-MM-DD
  isArchived: boolean;
  createdAt: number;
}

export interface SubmissionStatus {
  id: string; // `${assignmentId}_${studentId}`
  assignmentId: string;
  studentId: string;
  seatNumber: number;
  status: StatusType;
  updatedAt: number;
}

export interface HistoryAction {
  assignmentId: string;
  studentId: string;
  previousStatus: StatusType;
  newStatus: StatusType;
  timestamp: number;
}

export interface AppData {
  version: number;
  classes: ClassRecord[];
  students: StudentRecord[];
  assignments: AssignmentRecord[];
  statuses: SubmissionStatus[];
}

export type SummaryFormat = 'detailed' | 'compact' | 'pending-only' | 'need-fix-only';
