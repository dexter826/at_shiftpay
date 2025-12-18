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
  Unsubscribe,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS, PaymentTransaction } from '../types';

export const dbService = {
  // Employees - Real-time listener
  subscribeEmployees(callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      callback(employees);
    });
  },

  async addEmployee(data: { name: string; phone: string; imageUrl?: string }): Promise<void> {
    await addDoc(collection(db, 'employees'), {
      ...data,
      createdAt: new Date().toISOString(),
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

  // Create event and shifts together in one batch (atomic operation)
  async createEventWithShifts(eventData: Omit<Event, 'id'>, shiftsData: Omit<Shift, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);

    // Create event document
    const eventRef = doc(collection(db, 'events'));
    batch.set(eventRef, eventData);

    // Create all shifts with the event ID
    shiftsData.forEach(shiftData => {
      const shiftRef = doc(collection(db, 'shifts'));
      batch.set(shiftRef, { ...shiftData, eventId: eventRef.id });
    });

    await batch.commit();
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<void> {
    const docRef = doc(db, 'events', id);
    await updateDoc(docRef, data);
  },

  // Update event and replace all shifts in one batch (atomic operation)
  async updateEventWithShifts(
    eventId: string,
    eventData: Partial<Event>,
    oldShiftIds: string[],
    newShiftsData: Omit<Shift, 'id'>[]
  ): Promise<void> {
    const batch = writeBatch(db);

    // Update event
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, eventData);

    // Delete old shifts
    oldShiftIds.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });

    // Create new shifts
    newShiftsData.forEach(shiftData => {
      const shiftRef = doc(collection(db, 'shifts'));
      batch.set(shiftRef, shiftData);
    });

    await batch.commit();
  },

  // Delete event and all its shifts in one batch (atomic operation)
  async deleteEventWithShifts(eventId: string, shiftIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    // Delete event
    batch.delete(doc(db, 'events', eventId));

    // Delete all shifts
    shiftIds.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });

    await batch.commit();
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

  // Payments
  subscribePayments(callback: (payments: PaymentTransaction[]) => void): Unsubscribe {
    const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentTransaction));
      callback(payments);
    });
  },

  async createPaymentTransaction(
    paymentData: Omit<PaymentTransaction, 'id'>,
    shiftIds: string[]
  ): Promise<void> {
    const batch = writeBatch(db);

    // Create payment document
    const paymentRef = doc(collection(db, 'payments'));
    batch.set(paymentRef, paymentData);

    // Update all shifts to paid
    shiftIds.forEach(shiftId => {
      const shiftRef = doc(db, 'shifts', shiftId);
      batch.update(shiftRef, {
        status: 'paid',
        paidAt: paymentData.date,
        paymentId: paymentRef.id
      });
    });

    await batch.commit();
  },

  // User Settings
  subscribeSettings(callback: (settings: UserSettings) => void): Unsubscribe {
    const docRef = doc(db, 'settings', 'user');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserSettings);
      } else {
        callback(DEFAULT_SETTINGS);
      }
    });
  },

  async getSettings(): Promise<UserSettings> {
    const docRef = doc(db, 'settings', 'user');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserSettings;
    }
    return DEFAULT_SETTINGS;
  },

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'user');
    await setDoc(docRef, data, { merge: true });
  },
};
