import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  writeBatch,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS, PaymentTransaction } from '../types';

export const dbService = {
  // Employees - Real-time listener
  subscribeEmployees(callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    return onSnapshot(q,
      (snapshot) => {
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        callback(employees);
      },
      (error) => {
        console.error("Error subscribing employees:", error);
        callback([]);
      }
    );
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

  // Events - Real-time listener by Month
  subscribeEventsByMonth(month: number, year: number, callback: (events: Event[]) => void): Unsubscribe {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const q = query(
      collection(db, 'events'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    return onSnapshot(q,
      (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        callback(events);
      },
      (error) => {
        console.error("Error subscribing events:", error);
        callback([]);
      }
    );
  },

  async getEventsByMonth(month: number, year: number): Promise<Event[]> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const q = query(
      collection(db, 'events'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
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

  // Smart update event and shifts (create, update, delete)
  async batchUpdateEvent(
    eventId: string,
    eventData: Partial<Event>,
    shifts: {
      create: Omit<Shift, 'id'>[],
      update: { id: string, data: Partial<Shift> }[],
      delete: string[]
    }
  ): Promise<void> {
    const batch = writeBatch(db);

    // Update event
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, eventData);

    // Create new shifts
    shifts.create.forEach(shiftData => {
      const shiftRef = doc(collection(db, 'shifts'));
      batch.set(shiftRef, { ...shiftData, eventId });
    });

    // Update existing shifts
    shifts.update.forEach(({ id, data }) => {
      const shiftRef = doc(db, 'shifts', id);
      batch.update(shiftRef, data);
    });

    // Delete removed shifts
    shifts.delete.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
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

  // Shifts - Real-time listener by Month
  subscribeShiftsByMonth(month: number, year: number, callback: (shifts: Shift[]) => void): Unsubscribe {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const q = query(
      collection(db, 'shifts'),
      where('eventDate', '>=', startDate),
      where('eventDate', '<=', endDate),
      orderBy('eventDate', 'desc')
    );
    return onSnapshot(q,
      (snapshot) => {
        const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
        callback(shifts);
      },
      (error) => {
        console.error("Error subscribing shifts:", error);
        callback([]);
      }
    );
  },

  async getShiftsByMonth(month: number, year: number): Promise<Shift[]> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const q = query(
      collection(db, 'shifts'),
      where('eventDate', '>=', startDate),
      where('eventDate', '<=', endDate),
      orderBy('eventDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
  },

  // Subscribe to ALL unpaid shifts (for debt calculation)
  subscribeUnpaidShifts(callback: (shifts: Shift[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'shifts'),
      where('status', '==', 'unpaid'),
      orderBy('eventDate', 'asc') // Oldest debt first
    );
    return onSnapshot(q,
      (snapshot) => {
        const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
        callback(shifts);
      },
      (error) => {
        console.error("Error subscribing unpaid shifts (Likely missing Index):", error);
        callback([]);
      }
    );
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

    // Determine shift status based on payment type
    const shiftStatus = paymentData.type === 'advance' ? 'advanced' : 'paid';

    // Update all shifts
    shiftIds.forEach(shiftId => {
      const shiftRef = doc(db, 'shifts', shiftId);
      batch.update(shiftRef, {
        status: shiftStatus,
        paidAt: paymentData.date,
        paymentId: paymentRef.id
      });
    });

    await batch.commit();
  },

  // Tạo thanh toán ứng
  async createAdvancePayment(
    paymentData: Omit<PaymentTransaction, 'id' | 'type'>,
    shiftIds: string[]
  ): Promise<void> {
    await this.createPaymentTransaction(
      { ...paymentData, type: 'advance' },
      shiftIds
    );
  },

  // Quyết toán tiền ứng
  async settleAdvancePayment(
    employeeId: string,
    employeeName: string,
    advancePaymentIds: string[],
    shiftIds: string[],
    totalAmount: number
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = Date.now();

    // Tạo transaction quyết toán
    const settlementRef = doc(collection(db, 'payments'));
    batch.set(settlementRef, {
      employeeId,
      employeeName,
      amount: totalAmount,
      date: now,
      shiftIds,
      type: 'settlement',
      note: 'Quyết toán tiền ứng'
    });

    // Cập nhật các advance payments
    advancePaymentIds.forEach(paymentId => {
      const paymentRef = doc(db, 'payments', paymentId);
      batch.update(paymentRef, {
        settledAt: now,
        settledBy: settlementRef.id
      });
    });

    // Cập nhật shifts từ advanced thành paid
    shiftIds.forEach(shiftId => {
      const shiftRef = doc(db, 'shifts', shiftId);
      batch.update(shiftRef, {
        status: 'paid',
        paidAt: now,
        paymentId: settlementRef.id
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
