import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Employee, Event, Shift } from '../types';

export const dbService = {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
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

  // Events
  async getEvents(): Promise<Event[]> {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  },

  async addEvent(data: Omit<Event, 'id'>): Promise<void> {
    await addDoc(collection(db, 'events'), data);
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<void> {
    const docRef = doc(db, 'events', id);
    await updateDoc(docRef, data);
  },

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'events', id));
  },

  // Shifts
  async getShifts(): Promise<Shift[]> {
    const q = query(collection(db, 'shifts'), orderBy('eventDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
  },

  async addShift(data: Omit<Shift, 'id'>): Promise<void> {
    await addDoc(collection(db, 'shifts'), data);
  },

  async updateShift(id: string, data: Partial<Shift>): Promise<void> {
    const docRef = doc(db, 'shifts', id);
    await updateDoc(docRef, data);
  },

  async deleteShift(id: string): Promise<void> {
    await deleteDoc(doc(db, 'shifts', id));
  },
};