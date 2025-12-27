import { collection, query, where, orderBy, onSnapshot, getDocs, Unsubscribe, Query, WriteBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { safeValidate } from '../utils/validation';
import { z } from 'zod';

interface DateRangeQuery {
  collectionName: string;
  dateField: string;
  month: number;
  year: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export function buildMonthRangeQuery({
  collectionName,
  dateField,
  month,
  year,
  orderByField,
  orderDirection = 'desc'
}: DateRangeQuery): Query {
  let startDate: string;
  let endDate: string;

  if (month === -1) {
    // Cả năm
    startDate = new Date(year, 0, 1).toISOString();
    endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
  } else {
    // Theo tháng
    startDate = new Date(year, month, 1).toISOString();
    endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  }

  return query(
    collection(db, collectionName),
    where(dateField, '>=', startDate),
    where(dateField, '<=', endDate),
    orderBy(orderByField || dateField, orderDirection)
  );
}

export function createRealtimeSubscription<T>(
  q: Query,
  callback: (data: T[]) => void,
  errorContext: string,
  schema?: z.ZodSchema<T>
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (schema) {
        const validData = rawData
          .map(item => safeValidate(schema, item))
          .filter((item): item is T => item !== null);
        callback(validData);
      } else {
        callback(rawData as T[]);
      }
    },
    (error) => {
      console.error(`Error in ${errorContext}:`, error);
      callback([]);
    }
  );
}

export async function executeBatchQuery<T>(q: Query, schema?: z.ZodSchema<T>): Promise<T[]> {
  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (schema) {
    return rawData
      .map(item => safeValidate(schema, item))
      .filter((item): item is T => item !== null);
  }
  
  return rawData as T[];
}

export async function executeBatchWithRetry(
  batchOperation: () => Promise<void>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await batchOperation();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Batch operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw new Error(`Batch operation failed sau ${maxRetries} lần thử: ${lastError?.message}`);
}

