import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { Shift } from '../types';
import { buildMonthRangeQuery, createRealtimeSubscription, executeBatchQuery } from './firebase-helpers';
import { ShiftSchema } from '../utils/validation';

export const shiftService = {
  subscribeShiftsByMonth(month: number, year: number, callback: (shifts: Shift[]) => void): Unsubscribe {
    const q = buildMonthRangeQuery({
      collectionName: 'shifts',
      dateField: 'date',
      month,
      year
    });
    return createRealtimeSubscription<Shift>(q, callback, 'subscribeShiftsByMonth', ShiftSchema);
  },

  async getShiftsByMonth(month: number, year: number): Promise<Shift[]> {
    const q = buildMonthRangeQuery({
      collectionName: 'shifts',
      dateField: 'date',
      month: month - 1,
      year
    });
    return executeBatchQuery<Shift>(q, ShiftSchema);
  },

  subscribeUnpaidShifts(callback: (shifts: Shift[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'shifts'),
      where('status', 'in', ['unpaid', 'advanced']),
      orderBy('date', 'asc')
    );
    return createRealtimeSubscription<Shift>(q, callback, 'subscribeUnpaidShifts', ShiftSchema);
  },

  async addShift(data: Omit<Shift, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'shifts'), data);
    } catch (error) {
      console.error('addShift error:', error);
      throw new Error(`Không thể thêm ca làm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async addShiftsBatch(shiftsData: Omit<Shift, 'id'>[]): Promise<void> {
    if (shiftsData.length === 0) return;
    try {
      const batch = writeBatch(db);
      shiftsData.forEach(data => {
        const newDocRef = doc(collection(db, 'shifts'));
        batch.set(newDocRef, data);
      });
      await batch.commit();
    } catch (error) {
      console.error('addShiftsBatch error:', error);
      throw new Error(`Không thể thêm các ca làm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async deleteShiftsBatch(shiftIds: string[]): Promise<void> {
    if (shiftIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      shiftIds.forEach(id => {
        batch.delete(doc(db, 'shifts', id));
      });
      await batch.commit();
    } catch (error) {
      console.error('deleteShiftsBatch error:', error);
      throw new Error(`Không thể xóa các ca làm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async updateShift(id: string, data: Partial<Shift>): Promise<void> {
    try {
      const docRef = doc(db, 'shifts', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('updateShift error:', error);
      throw new Error(`Không thể cập nhật ca làm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async deleteShift(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'shifts', id));
    } catch (error) {
      console.error('deleteShift error:', error);
      throw new Error(`Không thể xóa ca làm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },
};
