import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData, ClassRecord, StudentRecord, AssignmentRecord, SubmissionStatus, StatusType } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (pass custom database ID if specified in config)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
    return false;
  }
}

// Auto sign-in anonymously for teachers who want seamless instant sync
export async function ensureTeacherAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous sign-in failed, continuing in local mode:', err);
    return null;
  }
}

// Upload full local AppData to Firestore under teacher's collection
export async function uploadAppDataToCloud(userId: string, data: AppData): Promise<void> {
  const batch = writeBatch(db);

  // Upload classes
  for (const cls of data.classes) {
    const ref = doc(db, 'users', userId, 'classes', cls.id);
    batch.set(ref, { ...cls, teacherId: userId });
  }

  // Upload students
  for (const st of data.students) {
    const ref = doc(db, 'users', userId, 'students', st.id);
    batch.set(ref, { ...st, teacherId: userId });
  }

  // Upload assignments
  for (const asg of data.assignments) {
    const ref = doc(db, 'users', userId, 'assignments', asg.id);
    batch.set(ref, { ...asg, teacherId: userId });
  }

  // Upload statuses
  for (const status of data.statuses) {
    const ref = doc(db, 'users', userId, 'statuses', status.id);
    batch.set(ref, { ...status, teacherId: userId });
  }

  await batch.commit();
}

// Real-time subscribe to teacher's full data
export function subscribeToTeacherData(
  userId: string,
  onDataUpdate: (data: Partial<AppData>) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubClasses = onSnapshot(
    collection(db, 'users', userId, 'classes'),
    (snapshot) => {
      const classes = snapshot.docs.map((d) => d.data() as ClassRecord);
      if (classes.length > 0) {
        onDataUpdate({ classes });
      }
    },
    (error) => {
      console.warn('Classes listener warning/offline:', error.message);
      if (onError) onError(error);
    }
  );

  const unsubStudents = onSnapshot(
    collection(db, 'users', userId, 'students'),
    (snapshot) => {
      const students = snapshot.docs.map((d) => d.data() as StudentRecord);
      if (students.length > 0) {
        onDataUpdate({ students });
      }
    },
    (error) => {
      console.warn('Students listener warning/offline:', error.message);
      if (onError) onError(error);
    }
  );

  const unsubAssignments = onSnapshot(
    collection(db, 'users', userId, 'assignments'),
    (snapshot) => {
      const assignments = snapshot.docs.map((d) => d.data() as AssignmentRecord);
      if (assignments.length > 0) {
        onDataUpdate({ assignments });
      }
    },
    (error) => {
      console.warn('Assignments listener warning/offline:', error.message);
      if (onError) onError(error);
    }
  );

  const unsubStatuses = onSnapshot(
    collection(db, 'users', userId, 'statuses'),
    (snapshot) => {
      const statuses = snapshot.docs.map((d) => d.data() as SubmissionStatus);
      onDataUpdate({ statuses });
    },
    (error) => {
      console.warn('Statuses listener warning/offline:', error.message);
      if (onError) onError(error);
    }
  );

  return () => {
    unsubClasses();
    unsubStudents();
    unsubAssignments();
    unsubStatuses();
  };
}

// Update single student status directly to cloud
export async function updateCloudStatus(
  userId: string,
  assignmentId: string,
  studentId: string,
  seatNumber: number,
  status: StatusType
): Promise<void> {
  const statusId = `${assignmentId}_${studentId}`;
  const ref = doc(db, 'users', userId, 'statuses', statusId);
  const payload: SubmissionStatus & { teacherId: string } = {
    id: statusId,
    assignmentId,
    studentId,
    seatNumber,
    status,
    updatedAt: Date.now(),
    teacherId: userId,
  };
  await setDoc(ref, payload);
}
