import { db } from '../firebase';
import {
  collection,
  doc,
  writeBatch,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { PaymentTransaction } from '../types';
import { createRealtimeSubscription, executeBatchWithRetry } from './firebase-helpers';
import { PaymentTransactionSchema } from '../utils/validation';

export const paymentService = {
  subscribePayments(callback: (payments: PaymentTransaction[]) => void): Unsubscribe {
    const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
    return createRealtimeSubscription<PaymentTransaction>(q, callback, 'subscribePayments', PaymentTransactionSchema);
  },

  async createPaymentTransaction(
    paymentData: Omit<PaymentTransaction, 'id'>,
    shiftIds: string[]
  ): Promise<void> {
    try {
      await executeBatchWithRetry(async () => {
        const batch = writeBatch(db);

        const paymentRef = doc(collection(db, 'payments'));
        batch.set(paymentRef, paymentData);

        const shiftStatus = paymentData.type === 'advance' ? 'advanced' : 'paid';

        shiftIds.forEach(shiftId => {
          const shiftRef = doc(db, 'shifts', shiftId);
          batch.update(shiftRef, {
            status: shiftStatus,
            paidAt: paymentData.date,
            paymentId: paymentRef.id
          });
        });

        await batch.commit();
      });
    } catch (error) {
      console.error('createPaymentTransaction error:', error);
      throw new Error(`Không thể tạo giao dịch thanh toán: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async createAdvancePayment(
    paymentData: Omit<PaymentTransaction, 'id' | 'type'>,
    shiftIds: string[]
  ): Promise<void> {
    try {
      await paymentService.createPaymentTransaction(
        { ...paymentData, type: 'advance' },
        shiftIds
      );
    } catch (error) {
      console.error('createAdvancePayment error:', error);
      throw new Error(`Không thể tạo ứng lương: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async settleAdvancePayment(
    employeeId: string,
    employeeName: string,
    advancePaymentIds: string[],
    shiftIds: string[],
    totalAmount: number
  ): Promise<void> {
    try {
      await executeBatchWithRetry(async () => {
        const batch = writeBatch(db);
        const now = Date.now();

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

        advancePaymentIds.forEach(paymentId => {
          const paymentRef = doc(db, 'payments', paymentId);
          batch.update(paymentRef, {
            settledAt: now,
            settledBy: settlementRef.id
          });
        });

        shiftIds.forEach(shiftId => {
          const shiftRef = doc(db, 'shifts', shiftId);
          batch.update(shiftRef, {
            status: 'paid',
            paidAt: now,
            paymentId: settlementRef.id
          });
        });

        await batch.commit();
      });
    } catch (error) {
      console.error('settleAdvancePayment error:', error);
      throw new Error(`Không thể quyết toán tiền ứng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },
};
