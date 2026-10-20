import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  loadAppData, 
  saveAppData, 
  getNextStatus, 
  generateInitialData,
  generateCleanEmptyData,
  getTodayDateString 
} from './utils/storage';
import { 
  AppData, 
  ClassRecord, 
  AssignmentRecord, 
  StudentRecord, 
  SubmissionStatus, 
  StatusType, 
  HistoryAction 
} from './types';
import { calculateStats } from './utils/formatSummary';
import { Header } from './components/Header';
import { AssignmentBar } from './components/AssignmentBar';
import { StatsBar } from './components/StatsBar';
import { StudentGrid } from './components/StudentGrid';
import { SummaryModal } from './components/SummaryModal';
import { ClassManageModal } from './components/ClassManageModal';
import { AssignmentModal } from './components/AssignmentModal';
import { BackupModal } from './components/BackupModal';
import { FirebaseModal } from './components/FirebaseModal';
import { DevLogModal } from './components/DevLogModal';
import { TeacherPasswordModal } from './components/TeacherPasswordModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { BlackboardModal } from './components/BlackboardModal';
import { 
  auth, 
  ensureTeacherAuth, 
  updateCloudStatus, 
  subscribeToTeacherData,
  uploadAppDataToCloud,
  getStoredRoomCode,
  setStoredRoomCode,
  subscribeToRoom,
  updateRoomStatus,
  uploadRoomData,
  getIsTeacherUnlocked
} from './utils/firebase';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [roomCode, setRoomCode] = useState<string>(() => getStoredRoomCode());
  const [isTeacherUnlocked, setIsTeacherUnlockedState] = useState<boolean>(() => getIsTeacherUnlocked());
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const data = loadAppData();
    return data.classes[0]?.id || '';
  });

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(() => {
    const data = loadAppData();
    const classId = data.classes[0]?.id;
    const match = data.assignments.find((a) => a.classId === classId && !a.isArchived);
    return match?.id || data.assignments[0]?.id || '';
  });

  // Undo history stack
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);

  // Modals visibility
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isClassManageOpen, setIsClassManageOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<AssignmentRecord | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [isDevLogOpen, setIsDevLogOpen] = useState(false);
  const [isBlackboardOpen, setIsBlackboardOpen] = useState(false);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(() => {
    return localStorage.getItem('checkhw_cloud_sync_enabled') === 'true';
  });

  // Real-time Firestore synchronization listener
  useEffect(() => {
    if (!isCloudSyncActive) return;

    let unsub = () => {};
    ensureTeacherAuth().then((user) => {
      if (!user) return;
      unsub = subscribeToTeacherData(
        user.uid,
        (partial) => {
          setAppData((prev) => {
            const merged = { ...prev, ...partial };
            saveAppData(merged);
            return merged;
          });
        },
        (err) => {
          console.warn('Firestore sync listener notice:', err.message);
        }
      );
    });

    return () => {
      unsub();
    };
  }, [isCloudSyncActive]);

  // Real-time Classroom Room Code synchronization listener (手機 ⇋ 大螢幕即時雙向連動)
  useEffect(() => {
    if (!roomCode) return;

    let unsub = () => {};
    ensureTeacherAuth().then(() => {
      unsub = subscribeToRoom(
        roomCode,
        (partial) => {
          setAppData((prev) => {
            const merged = { ...prev, ...partial };
            saveAppData(merged);
            return merged;
          });

          // Automatically sync activeClassId and activeAssignmentId to the new room's class
          if (partial.classes && partial.classes.length > 0) {
            setActiveClassId((current) => {
              const exists = partial.classes!.some((c) => c.id === current);
              return exists ? current : partial.classes![0].id;
            });
          }
          if (partial.assignments && partial.assignments.length > 0) {
            setActiveAssignmentId((current) => {
              const exists = partial.assignments!.some((a) => a.id === current);
              return exists ? current : partial.assignments![0].id;
            });
          }
        },
        (err) => {
          console.warn('Room code sync notice:', err.message);
        }
      );
    });

    return () => {
      unsub();
    };
  }, [roomCode]);

  // Active class object
  const activeClass = useMemo(() => {
    return appData.classes.find((c) => c.id === activeClassId) || appData.classes[0];
  }, [appData.classes, activeClassId]);

  // Active class's assignments
  const classAssignments = useMemo(() => {
    if (!activeClass) return [];
    return appData.assignments.filter((a) => a.classId === activeClass.id);
  }, [appData.assignments, activeClass]);

  // Active assignment object
  const activeAssignment = useMemo(() => {
    const found = classAssignments.find((a) => a.id === activeAssignmentId);
    if (found) return found;
    return classAssignments.find((a) => !a.isArchived) || classAssignments[0];
  }, [classAssignments, activeAssignmentId]);

  // Keep activeAssignmentId synchronized if class changes
  useEffect(() => {
    if (activeClass) {
      const match = appData.assignments.find((a) => a.classId === activeClass.id && !a.isArchived);
      if (match) {
        setActiveAssignmentId(match.id);
      } else {
        const anyMatch = appData.assignments.find((a) => a.classId === activeClass.id);
        if (anyMatch) {
          setActiveAssignmentId(anyMatch.id);
        }
      }
    }
  }, [activeClassId]);

  // Students of active class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return appData.students.filter((s) => s.classId === activeClass.id);
  }, [appData.students, activeClass]);

  // Calculated statistics
  const currentStats = useMemo(() => {
    if (!activeAssignment) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        needFix: 0,
        completedPercent: 0,
        pendingSeats: [],
        needFixSeats: [],
        completedSeats: [],
      };
    }
    return calculateStats(classStudents, appData.statuses, activeAssignment.id);
  }, [classStudents, appData.statuses, activeAssignment]);

  // Persist appData whenever it changes and sync to connected room
  const updateAppDataAndSave = useCallback((newData: AppData) => {
    setAppData(newData);
    saveAppData(newData);
    const code = getStoredRoomCode();
    if (code) {
      uploadRoomData(code, newData).catch((err) => {
        console.warn('Room auto-sync notice:', err);
      });
    }
  }, []);

  // Cycle student status: pending -> completed -> need-fix -> pending
  const handleToggleStudentStatus = useCallback(
    (studentId: string, currentStatus: StatusType) => {
      if (!activeAssignment) return;

      const next = getNextStatus(currentStatus);
      const student = classStudents.find((s) => s.id === studentId);
      if (!student) return;

      // Push to undo stack (keep up to 30 items)
      setUndoStack((prev) => [
        {
          assignmentId: activeAssignment.id,
          studentId,
          previousStatus: currentStatus,
          newStatus: next,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 29),
      ]);

      const statusKey = `${activeAssignment.id}_${studentId}`;
      const existingIndex = appData.statuses.findIndex(
        (st) => st.assignmentId === activeAssignment.id && st.studentId === studentId
      );

      let updatedStatuses = [...appData.statuses];
      if (existingIndex >= 0) {
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          status: next,
          updatedAt: Date.now(),
        };
      } else {
        updatedStatuses.push({
          id: statusKey,
          assignmentId: activeAssignment.id,
          studentId,
          seatNumber: student.seatNumber,
          status: next,
          updatedAt: Date.now(),
        });
      }

      updateAppDataAndSave({
        ...appData,
        statuses: updatedStatuses,
      });

      // Synchronize with Cloud Firestore in background
      if (isCloudSyncActive && auth.currentUser) {
        updateCloudStatus(auth.currentUser.uid, activeAssignment.id, studentId, student.seatNumber, next).catch((err) => {
          console.warn('Cloud status sync deferred/offline:', err);
        });
      }

      // Synchronize with Classroom Room Code in background (手機 ⇋ 大螢幕即時連線)
      if (roomCode) {
        updateRoomStatus(roomCode, activeAssignment.id, studentId, student.seatNumber, next).catch((err) => {
          console.warn('Room status sync notice:', err);
        });
      }
    },
    [activeAssignment, classStudents, appData, updateAppDataAndSave, isCloudSyncActive, roomCode]
  );

  // Directly set student status (for brush mode or direct button)
  const handleSetStudentStatus = useCallback(
    (studentId: string, targetStatus: StatusType) => {
      if (!activeAssignment) return;
      const student = classStudents.find((s) => s.id === studentId);
      if (!student) return;

      const existingIndex = appData.statuses.findIndex(
        (st) => st.assignmentId === activeAssignment.id && st.studentId === studentId
      );
      const prevStatus = existingIndex >= 0 ? appData.statuses[existingIndex].status : 'pending';

      if (prevStatus === targetStatus) return;

      setUndoStack((prev) => [
        {
          assignmentId: activeAssignment.id,
          studentId,
          previousStatus: prevStatus,
          newStatus: targetStatus,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 29),
      ]);

      let updatedStatuses = [...appData.statuses];
      if (existingIndex >= 0) {
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          status: targetStatus,
          updatedAt: Date.now(),
        };
      } else {
        updatedStatuses.push({
          id: `${activeAssignment.id}_${studentId}`,
          assignmentId: activeAssignment.id,
          studentId,
          seatNumber: student.seatNumber,
          status: targetStatus,
          updatedAt: Date.now(),
        });
      }

      updateAppDataAndSave({
        ...appData,
        statuses: updatedStatuses,
      });

      // Synchronize with Cloud Firestore in background
      if (isCloudSyncActive && auth.currentUser) {
        updateCloudStatus(auth.currentUser.uid, activeAssignment.id, studentId, student.seatNumber, targetStatus).catch((err) => {
          console.warn('Cloud status sync deferred/offline:', err);
        });
      }

      // Synchronize with Classroom Room Code in background (手機 ⇋ 大螢幕即時連線)
      if (roomCode) {
        updateRoomStatus(roomCode, activeAssignment.id, studentId, student.seatNumber, targetStatus).catch((err) => {
          console.warn('Room status sync notice:', err);
        });
      }
    },
    [activeAssignment, classStudents, appData, updateAppDataAndSave, isCloudSyncActive, roomCode]
  );

  // Quick reset single student to pending
  const handleResetStudentStatus = useCallback(
    (studentId: string) => {
      if (!activeAssignment) return;
      const student = classStudents.find((s) => s.id === studentId);
      if (!student) return;

      const existingIndex = appData.statuses.findIndex(
        (st) => st.assignmentId === activeAssignment.id && st.studentId === studentId
      );

      const prevStatus = existingIndex >= 0 ? appData.statuses[existingIndex].status : 'pending';
      if (prevStatus === 'pending') return;

      setUndoStack((prev) => [
        {
          assignmentId: activeAssignment.id,
          studentId,
          previousStatus: prevStatus,
          newStatus: 'pending',
          timestamp: Date.now(),
        },
        ...prev.slice(0, 29),
      ]);

      let updatedStatuses = [...appData.statuses];
      if (existingIndex >= 0) {
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          status: 'pending',
          updatedAt: Date.now(),
        };
      } else {
        updatedStatuses.push({
          id: `${activeAssignment.id}_${studentId}`,
          assignmentId: activeAssignment.id,
          studentId,
          seatNumber: student.seatNumber,
          status: 'pending',
          updatedAt: Date.now(),
        });
      }

      updateAppDataAndSave({
        ...appData,
        statuses: updatedStatuses,
      });
    },
    [activeAssignment, classStudents, appData, updateAppDataAndSave]
  );

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [lastAction, ...remainingStack] = undoStack;

    const existingIndex = appData.statuses.findIndex(
      (st) => st.assignmentId === lastAction.assignmentId && st.studentId === lastAction.studentId
    );

    let updatedStatuses = [...appData.statuses];
    if (existingIndex >= 0) {
      updatedStatuses[existingIndex] = {
        ...updatedStatuses[existingIndex],
        status: lastAction.previousStatus,
        updatedAt: Date.now(),
      };
    }

    setUndoStack(remainingStack);
    updateAppDataAndSave({
      ...appData,
      statuses: updatedStatuses,
    });
  }, [undoStack, appData, updateAppDataAndSave]);

  // Keyboard shortcut Ctrl+Z / Cmd+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (undoStack.length > 0 && !isSummaryOpen && !isClassManageOpen && !isAssignmentModalOpen && !isBackupOpen) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, undoStack, isSummaryOpen, isClassManageOpen, isAssignmentModalOpen, isBackupOpen]);

  // Batch status: All completed or All pending
  const handleBatchSetStatus = (status: 'completed' | 'pending') => {
    if (!activeAssignment) return;
    const activeStudents = classStudents.filter((s) => s.isActive);

    const updatedStatuses = [...appData.statuses];
    activeStudents.forEach((student) => {
      const idx = updatedStatuses.findIndex(
        (st) => st.assignmentId === activeAssignment.id && st.studentId === student.id
      );
      if (idx >= 0) {
        updatedStatuses[idx] = {
          ...updatedStatuses[idx],
          status,
          updatedAt: Date.now(),
        };
      } else {
        updatedStatuses.push({
          id: `${activeAssignment.id}_${student.id}`,
          assignmentId: activeAssignment.id,
          studentId: student.id,
          seatNumber: student.seatNumber,
          status,
          updatedAt: Date.now(),
        });
      }
    });

    updateAppDataAndSave({
      ...appData,
      statuses: updatedStatuses,
    });
  };

  // Create or edit assignment
  const handleSaveAssignment = (title: string, date: string, id?: string) => {
    if (!activeClass) return;

    if (id) {
      // Edit
      const updatedAsgs = appData.assignments.map((a) =>
        a.id === id ? { ...a, title, date } : a
      );
      const updatedData: AppData = { ...appData, assignments: updatedAsgs };
      updateAppDataAndSave(updatedData);
      if (roomCode) {
        uploadRoomData(roomCode, updatedData).catch((err) => {
          console.warn('Sync edit assignment to room error:', err);
        });
      }
    } else {
      // Create new
      const newAsg: AssignmentRecord = {
        id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        classId: activeClass.id,
        title,
        date,
        isArchived: false,
        createdAt: Date.now(),
      };
      // Initialize pending statuses for active students
      const newStatuses: SubmissionStatus[] = classStudents.map((s) => ({
        id: `${newAsg.id}_${s.id}`,
        assignmentId: newAsg.id,
        studentId: s.id,
        seatNumber: s.seatNumber,
        status: 'pending',
        updatedAt: Date.now(),
      }));

      const updatedData: AppData = {
        ...appData,
        assignments: [newAsg, ...appData.assignments],
        statuses: [...appData.statuses, ...newStatuses],
      };

      updateAppDataAndSave(updatedData);
      setActiveAssignmentId(newAsg.id);

      if (roomCode) {
        uploadRoomData(roomCode, updatedData).catch((err) => {
          console.warn('Sync new assignment to room error:', err);
        });
      }
    }
  };

  // Toggle archive assignment
  const handleToggleArchiveAssignment = (asgId: string) => {
    const updatedAsgs = appData.assignments.map((a) =>
      a.id === asgId ? { ...a, isArchived: !a.isArchived } : a
    );
    const updatedData: AppData = { ...appData, assignments: updatedAsgs };
    updateAppDataAndSave(updatedData);
    if (roomCode) {
      uploadRoomData(roomCode, updatedData).catch((err) => {
        console.warn('Sync archive assignment to room error:', err);
      });
    }
  };

  // Delete assignment (direct delete without window.confirm to prevent iframe suppression)
  const handleDeleteAssignment = (asgId: string) => {
    const target = appData.assignments.find((a) => a.id === asgId);
    if (!target) return;

    const remainingAsgs = appData.assignments.filter((a) => a.id !== asgId);
    const remainingStatuses = appData.statuses.filter((st) => st.assignmentId !== asgId);

    const updatedData: AppData = {
      ...appData,
      assignments: remainingAsgs,
      statuses: remainingStatuses,
    };

    updateAppDataAndSave(updatedData);

    if (roomCode) {
      uploadRoomData(roomCode, updatedData).catch((err) => {
        console.warn('Sync delete assignment to room error:', err);
      });
    }

    const nextActive = remainingAsgs.find((a) => a.classId === activeClassId && !a.isArchived);
    setActiveAssignmentId(nextActive?.id || remainingAsgs[0]?.id || '');
  };

  // Add new class
  const handleAddClass = (name: string, count: number) => {
    const newClassId = `class_${Date.now()}`;
    const newClass: ClassRecord = {
      id: newClassId,
      name,
      studentCount: count,
      createdAt: Date.now(),
    };

    const newStudents: StudentRecord[] = [];
    for (let i = 1; i <= count; i++) {
      newStudents.push({
        id: `student_${newClassId}_${i}`,
        classId: newClassId,
        seatNumber: i,
        name: '',
        isActive: true,
      });
    }

    const defaultAsg: AssignmentRecord = {
      id: `asg_${Date.now()}_default`,
      classId: newClassId,
      title: '第一份課堂作業',
      date: getTodayDateString(),
      isArchived: false,
      createdAt: Date.now(),
    };

    const newStatuses: SubmissionStatus[] = newStudents.map((s) => ({
      id: `${defaultAsg.id}_${s.id}`,
      assignmentId: defaultAsg.id,
      studentId: s.id,
      seatNumber: s.seatNumber,
      status: 'pending',
      updatedAt: Date.now(),
    }));

    updateAppDataAndSave({
      ...appData,
      classes: [...appData.classes, newClass],
      students: [...appData.students, ...newStudents],
      assignments: [...appData.assignments, defaultAsg],
      statuses: [...appData.statuses, ...newStatuses],
    });

    setActiveClassId(newClassId);
    setActiveAssignmentId(defaultAsg.id);
  };

  // Update class name
  const handleUpdateClass = (classId: string, name: string) => {
    const updated = appData.classes.map((c) =>
      c.id === classId ? { ...c, name } : c
    );
    updateAppDataAndSave({ ...appData, classes: updated });
  };

  // Delete class
  const handleDeleteClass = (classId: string) => {
    if (appData.classes.length <= 1) {
      alert('請至少保留一個班級！');
      return;
    }
    const remainingClasses = appData.classes.filter((c) => c.id !== classId);
    const remainingStudents = appData.students.filter((s) => s.classId !== classId);
    const remainingAssignments = appData.assignments.filter((a) => a.classId !== classId);
    const deletedAsgIds = new Set(appData.assignments.filter((a) => a.classId === classId).map((a) => a.id));
    const remainingStatuses = appData.statuses.filter((st) => !deletedAsgIds.has(st.assignmentId));

    updateAppDataAndSave({
      ...appData,
      classes: remainingClasses,
      students: remainingStudents,
      assignments: remainingAssignments,
      statuses: remainingStatuses,
    });

    setActiveClassId(remainingClasses[0].id);
  };

  // Permanently delete a single student (removes student & cleanup orphan statuses)
  const handleDeleteStudent = (studentId: string) => {
    const student = appData.students.find((s) => s.id === studentId);
    if (!student) return;

    const remainingStudents = appData.students.filter((s) => s.id !== studentId);
    const remainingStatuses = appData.statuses.filter((st) => st.studentId !== studentId);
    const updatedClasses = appData.classes.map((c) => {
      if (c.id === student.classId) {
        const count = remainingStudents.filter((s) => s.classId === c.id && s.isActive).length;
        return { ...c, studentCount: count };
      }
      return c;
    });

    updateAppDataAndSave({
      ...appData,
      classes: updatedClasses,
      students: remainingStudents,
      statuses: remainingStatuses,
    });
  };

  // Direct class size resizing (e.g. set to 24 students, automatically trims or adds seats)
  const handleSetClassCount = (classId: string, targetCount: number) => {
    if (targetCount <= 0) return;
    const currentClassStudents = appData.students
      .filter((s) => s.classId === classId)
      .sort((a, b) => a.seatNumber - b.seatNumber);
    const otherStudents = appData.students.filter((s) => s.classId !== classId);

    let updatedClassStudents: StudentRecord[] = [];
    if (targetCount < currentClassStudents.length) {
      // Trim to targetCount
      updatedClassStudents = currentClassStudents.slice(0, targetCount);
    } else if (targetCount > currentClassStudents.length) {
      // Add missing seats
      updatedClassStudents = [...currentClassStudents];
      const maxSeat = currentClassStudents.reduce((max, s) => Math.max(max, s.seatNumber), 0);
      for (let i = 1; i <= targetCount - currentClassStudents.length; i++) {
        const seatNum = maxSeat + i;
        updatedClassStudents.push({
          id: `student_${classId}_${seatNum}_${Date.now()}_${i}`,
          classId,
          seatNumber: seatNum,
          name: '',
          isActive: true,
        });
      }
    } else {
      return;
    }

    const validStudentIds = new Set(updatedClassStudents.map((s) => s.id));
    const cleanedStatuses = appData.statuses.filter((st) => {
      const asg = appData.assignments.find((a) => a.id === st.assignmentId);
      if (asg && asg.classId === classId) {
        return validStudentIds.has(st.studentId);
      }
      return true;
    });

    const updatedClasses = appData.classes.map((c) =>
      c.id === classId ? { ...c, studentCount: updatedClassStudents.filter((s) => s.isActive).length } : c
    );

    updateAppDataAndSave({
      ...appData,
      classes: updatedClasses,
      students: [...otherStudents, ...updatedClassStudents],
      statuses: cleanedStatuses,
    });
  };

  // Update student roster
  const handleUpdateStudents = (classId: string, updatedClassStudents: StudentRecord[]) => {
    const otherStudents = appData.students.filter((s) => s.classId !== classId);
    const newStudentCount = updatedClassStudents.filter((s) => s.isActive).length;

    // Clean up orphan statuses
    const validStudentIds = new Set(updatedClassStudents.map((s) => s.id));
    const cleanedStatuses = appData.statuses.filter((st) => {
      const asg = appData.assignments.find((a) => a.id === st.assignmentId);
      if (asg && asg.classId === classId) {
        return validStudentIds.has(st.studentId);
      }
      return true;
    });

    const updatedClasses = appData.classes.map((c) =>
      c.id === classId ? { ...c, studentCount: newStudentCount } : c
    );

    updateAppDataAndSave({
      ...appData,
      classes: updatedClasses,
      students: [...otherStudents, ...updatedClassStudents],
      statuses: cleanedStatuses,
    });
  };

  // Reset to clean empty data (不留任何範本)
  const handleResetData = () => {
    const cleanEmpty = generateCleanEmptyData();
    updateAppDataAndSave(cleanEmpty);
    setActiveClassId('');
    setActiveAssignmentId('');
    setUndoStack([]);
  };

  // Standalone HTML generation for download
  const handleDownloadStandaloneHtml = () => {
    // Generate standalone index.html content
    fetch('/standalone.html')
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.text();
      })
      .catch(() => {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CheckHW</title></head><body>CheckHW Standalone Prototype</body></html>`;
      })
      .then((content) => {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CheckHW_單一檔案免安裝離線版.html`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-12">
      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* 1. Top Header */}
      <Header
        classes={appData.classes}
        activeClassId={activeClassId}
        onSelectClass={setActiveClassId}
        onOpenClassManage={() => setIsClassManageOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenFirebase={() => setIsFirebaseOpen(true)}
        onOpenDevLog={() => setIsDevLogOpen(true)}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
        isCloudSyncActive={isCloudSyncActive}
        roomCode={roomCode}
        isTeacherUnlocked={isTeacherUnlocked}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onOpenBlackboard={() => setIsBlackboardOpen(true)}
      />

      {/* 2. Assignment Management Bar */}
      <AssignmentBar
        assignments={classAssignments}
        activeAssignmentId={activeAssignment?.id || ''}
        onSelectAssignment={setActiveAssignmentId}
        onOpenCreateAssignment={() => {
          setAssignmentToEdit(null);
          setIsAssignmentModalOpen(true);
        }}
        onOpenEditAssignment={(asg) => {
          setAssignmentToEdit(asg);
          setIsAssignmentModalOpen(true);
        }}
        onDeleteAssignment={handleDeleteAssignment}
        onToggleArchive={handleToggleArchiveAssignment}
        onBatchSetStatus={handleBatchSetStatus}
        isTeacherUnlocked={isTeacherUnlocked}
      />

      {/* 3. Core Seat Number Grid (Thumb-friendly & responsive) */}
      <main className="flex-1">
        {appData.classes.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs border border-blue-100">
              🏫
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">已退出教室，目前為乾淨空白狀態</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                本機資料庫已全數清空，未保留任何班級、學生與作業範本。<br />
                請點擊下方輸入教室代碼連線，或手動建立新班級開始清點。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsFirebaseOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <span>🔑 輸入教室代碼連線</span>
              </button>
              <button
                onClick={() => setIsClassManageOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-colors"
              >
                <span>➕ 手動建立新班級</span>
              </button>
            </div>
          </div>
        ) : activeAssignment ? (
          <StudentGrid
            students={classStudents}
            statuses={appData.statuses}
            assignmentId={activeAssignment.id}
            classId={activeClass.id}
            onToggleStudentStatus={handleToggleStudentStatus}
            onSetStudentStatus={handleSetStudentStatus}
            onResetStudentStatus={handleResetStudentStatus}
            onDeleteStudent={handleDeleteStudent}
            onOpenClassManage={() => setIsClassManageOpen(true)}
            onUpdateStudents={handleUpdateStudents}
            isTeacherUnlocked={isTeacherUnlocked}
            onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
            onOpenBlackboard={() => setIsBlackboardOpen(true)}
            statsBar={
              <StatsBar
                stats={currentStats}
                onOpenSummary={() => setIsSummaryOpen(true)}
                onOpenBlackboard={() => setIsBlackboardOpen(true)}
              />
            }
          />
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-4">
            <p className="text-slate-500 mb-4">此班級目前沒有任何清點作業</p>
            <button
              onClick={() => {
                setAssignmentToEdit(null);
                setIsAssignmentModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm"
            >
              立即新增作業
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile: Quick LINE Summary */}
      <div className="fixed bottom-4 right-4 sm:hidden z-30">
        <button
          onClick={() => setIsSummaryOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all text-sm"
        >
          <span>LINE 摘要 ({currentStats.pending}未交)</span>
        </button>
      </div>

      {/* Modals */}
      {activeClass && activeAssignment && (
        <SummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          activeClass={activeClass}
          activeAssignment={activeAssignment}
          stats={currentStats}
        />
      )}

      <ClassManageModal
        isOpen={isClassManageOpen}
        onClose={() => setIsClassManageOpen(false)}
        classes={appData.classes}
        activeClassId={activeClass?.id || ''}
        students={appData.students}
        onAddClass={handleAddClass}
        onUpdateClass={handleUpdateClass}
        onDeleteClass={handleDeleteClass}
        onUpdateStudents={handleUpdateStudents}
        onDeleteStudent={handleDeleteStudent}
        onSetClassCount={handleSetClassCount}
      />

      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        assignmentToEdit={assignmentToEdit}
        onSaveAssignment={handleSaveAssignment}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        appData={appData}
        activeClass={activeClass}
        activeAssignment={activeAssignment}
        onImportData={async (data) => {
          updateAppDataAndSave(data);
          setActiveClassId(data.classes[0]?.id || '');
          setActiveAssignmentId(data.assignments[0]?.id || '');
          try {
            const user = auth.currentUser || (await ensureTeacherAuth());
            if (user) {
              await uploadAppDataToCloud(user.uid, data);
            }
            if (roomCode) {
              await uploadRoomData(roomCode, data);
            }
          } catch (err) {
            console.warn('Sync imported data to cloud/room notice:', err);
          }
        }}
        onResetData={handleResetData}
        onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
      />

      <FirebaseModal
        isOpen={isFirebaseOpen}
        onClose={() => {
          setIsFirebaseOpen(false);
          setIsCloudSyncActive(localStorage.getItem('checkhw_cloud_sync_enabled') === 'true');
          setRoomCode(getStoredRoomCode());
        }}
        appData={appData}
        onSyncDataFromCloud={(partial) => {
          setAppData((prev) => {
            const merged = { ...prev, ...partial };
            saveAppData(merged);
            return merged;
          });
        }}
        roomCode={roomCode}
        onUpdateRoomCode={(code) => setRoomCode(code)}
        isTeacherUnlocked={isTeacherUnlocked}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />

      <DevLogModal
        isOpen={isDevLogOpen}
        onClose={() => setIsDevLogOpen(false)}
      />

      <TeacherPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        isUnlocked={isTeacherUnlocked}
        onUnlockSuccess={() => setIsTeacherUnlockedState(true)}
        onLockSuccess={() => setIsTeacherUnlockedState(false)}
        appData={appData}
      />

      <BlackboardModal
        isOpen={isBlackboardOpen}
        onClose={() => setIsBlackboardOpen(false)}
        activeClass={activeClass}
        students={appData.students}
        assignments={appData.assignments}
        statuses={appData.statuses}
        onSetStudentStatus={handleSetStudentStatus}
      />
    </div>
  );
}
