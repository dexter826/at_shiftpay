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
  deleteField,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, Event, Shift, UserSettings, DEFAULT_SETTINGS, PaymentTransaction, BankAccount } from '../types';

export const dbService = {
  // Realtime nhân viên
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

  async addEmployee(data: { name: string; phone: string; imageUrl?: string; bankAccount?: BankAccount }): Promise<void> {
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

  // Lấy sự kiện theo tháng
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

  // Tạo event và shift (atomic)
  async createEventWithShifts(eventData: Omit<Event, 'id'>, shiftsData: Omit<Shift, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);

    // Tạo doc event mới
    const eventRef = doc(collection(db, 'events'));
    batch.set(eventRef, eventData);

    // Tạo doc shift
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

  // Cập nhật sự kiện (reset ca)
  async updateEventWithShifts(
    eventId: string,
    eventData: Partial<Event>,
    oldShiftIds: string[],
    newShiftsData: Omit<Shift, 'id'>[]
  ): Promise<void> {
    const batch = writeBatch(db);

    // Cập nhật thông tin event
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, eventData);

    // Xóa shift cũ
    oldShiftIds.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });

    // Tạo shift mới
    newShiftsData.forEach(shiftData => {
      const shiftRef = doc(collection(db, 'shifts'));
      batch.set(shiftRef, shiftData);
    });

    await batch.commit();
  },

  // Cập nhật hàng loạt
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

    // Cập nhật thông tin event
    const eventRef = doc(db, 'events', eventId);
    batch.update(eventRef, eventData);

    // Tạo shift mới
    shifts.create.forEach(shiftData => {
      const shiftRef = doc(collection(db, 'shifts'));
      batch.set(shiftRef, { ...shiftData, eventId });
    });

    // Cập nhật ca đã có
    shifts.update.forEach(({ id, data }) => {
      const shiftRef = doc(db, 'shifts', id);
      batch.update(shiftRef, data);
    });

    // Xóa ca bị gỡ
    shifts.delete.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });

    await batch.commit();
  },

  // Xóa sự kiện & ca liên quan
  async deleteEventWithShifts(eventId: string, shiftIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    // Xóa doc event
    batch.delete(doc(db, 'events', eventId));

    // Xóa toàn bộ shift
    shiftIds.forEach(id => {
      batch.delete(doc(db, 'shifts', id));
    });

    await batch.commit();
  },

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'events', id));
  },

  // Lấy shift theo tháng
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

  // Lấy shift chưa trả
  subscribeUnpaidShifts(callback: (shifts: Shift[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'shifts'),
      where('status', '==', 'unpaid'),
      orderBy('eventDate', 'asc') // Nợ cũ trước
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

  // Thêm nhiều ca
  async addShiftsBatch(shiftsData: Omit<Shift, 'id'>[]): Promise<void> {
    if (shiftsData.length === 0) return;
    const batch = writeBatch(db);
    shiftsData.forEach(data => {
      const newDocRef = doc(collection(db, 'shifts'));
      batch.set(newDocRef, data);
    });
    await batch.commit();
  },

  // Xóa nhiều ca
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

  // Theo dõi thanh toán
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

    // Tạo giao dịch
    const paymentRef = doc(collection(db, 'payments'));
    batch.set(paymentRef, paymentData);

    // Xác định status mới
    const shiftStatus = paymentData.type === 'advance' ? 'advanced' : 'paid';

    // Update status shift
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

  // Tạo advance payment
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

    // Tạo đơn quyết toán
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

    // Cập nhật đơn ứng
    advancePaymentIds.forEach(paymentId => {
      const paymentRef = doc(db, 'payments', paymentId);
      batch.update(paymentRef, {
        settledAt: now,
        settledBy: settlementRef.id
      });
    });

    // Đổi status sang paid
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

  // Theo dõi cài đặt
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

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'user');
    await setDoc(docRef, data, { merge: true });
  },
};

export { deleteField };
