import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, Event, Shift } from '../types';

export const dbService = {
  // Employees - Real-time listener
  subscribeEmployees(callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      callback(employees);
    });
  },

  async addEmployee(data: { name: string; phone: string }): Promise<void> {
    await addDoc(collection(db, 'employees'), {
      ...data,
      createdAt: Date.now(),
    });
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, data);
  },

  async deleteEmployee(id: string): Promise<void> {
    await deleteDoc(doc(db, 'employees', id));
  },

  // Events - Real-time listener
  subscribeEvents(callback: (events: Event[]) => void): Unsubscribe {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      callback(events);
    });
  },

  async addEvent(data: Omit<Event, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'events'), data);
    return docRef.id;
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<void> {
    const docRef = doc(db, 'events', id);
    await updateDoc(docRef, data);
  },

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'events', id));
  },

  // Shifts - Real-time listener
  subscribeShifts(callback: (shifts: Shift[]) => void): Unsubscribe {
    const q = query(collection(db, 'shifts'), orderBy('eventDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      callback(shifts);
    });
  },

  async addShift(data: Omit<Shift, 'id'>): Promise<void> {
    await addDoc(collection(db, 'shifts'), data);
  },

  // Batch add multiple shifts at once (prevents UI flickering)
  async addShiftsBatch(shiftsData: Omit<Shift, 'id'>[]): Promise<void> {
    if (shiftsData.length === 0) return;
    const batch = writeBatch(db);
    shiftsData.forEach(data => {
      const newDocRef = doc(collection(db, 'shifts'));
      batch.set(newDocRef, data);
    });
    await batch.commit();
  },

  // Batch delete multiple shifts at once
  async deleteShiftsBatch(shiftIds: string[]): Promise<void> {
    if (shiftIds.length === 0) return;
    const batch = writeBatch(db);
    shiftIds.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });
    await batch.commit();
  },

  async updateShift(id: string, data: Partial<Shift>): Promise<void> {
    const docRef = doc(db, 'shifts', id);
    await updateDoc(docRef, data);
  },

  async deleteShift(id: string): Promise<void> {
    await deleteDoc(doc(db, 'shifts', id));
  },
};
