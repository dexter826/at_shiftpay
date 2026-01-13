import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, BankAccount } from '../types';
import { createRealtimeSubscription } from './firebaseService';
import { EmployeeSchema } from '../utils/validation';

export const employeeService = {
  subscribeEmployees(userId: string, callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'employees'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return createRealtimeSubscription<Employee>(q, callback, 'subscribeEmployees', EmployeeSchema);
  },

  async addEmployee(data: { name: string; phone: string; imageUrl?: string; bankAccount?: BankAccount }, userId: string): Promise<void> {
    try {
      await addDoc(collection(db, 'employees'), {
        ...data,
        createdAt: new Date().toISOString(),
        userId,
      });
    } catch (error) {
      console.error('addEmployee error:', error);
      throw new Error(`Không thể thêm nhân viên: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    try {
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('updateEmployee error:', error);
      throw new Error(`Không thể cập nhật nhân viên: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      console.error('deleteEmployee error:', error);
      throw new Error(`Không thể xóa nhân viên: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },
};
