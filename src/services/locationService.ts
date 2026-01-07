import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Unsubscribe,
  getDocs,
  where,
  limit,
  writeBatch,
  deleteField
} from 'firebase/firestore';
import { Location } from '../types';
import { createRealtimeSubscription } from './firebase-helpers';
import { LocationSchema } from '../utils/validation';

export const locationService = {
  subscribeLocations(callback: (locations: Location[]) => void): Unsubscribe {
    const q = query(collection(db, 'locations'), orderBy('name', 'asc'));
    return createRealtimeSubscription<Location>(q, callback, 'subscribeLocations', LocationSchema);
  },

  async addLocation(data: { name: string; review?: 'high' | 'low'; reviewNote?: string }): Promise<string> {
    try {
      // Lọc bỏ field undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(collection(db, 'locations'), {
        ...cleanData,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('addLocation error:', error);
      throw new Error(`Không thể thêm địa điểm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async updateLocation(id: string, data: Partial<Location>): Promise<void> {
    try {
      const docRef = doc(db, 'locations', id);
      // Lọc bỏ field undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(docRef, cleanData);
    } catch (error) {
      console.error('updateLocation error:', error);
      throw new Error(`Không thể cập nhật địa điểm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async deleteLocation(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch (error) {
      console.error('deleteLocation error:', error);
      throw new Error(`Không thể xóa địa điểm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },

  async findOrCreateLocation(name: string, reviewData?: { review?: 'high' | 'low'; reviewNote?: string }): Promise<string> {
    try {
      const q = query(collection(db, 'locations'), where('name', '==', name), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const locationDoc = querySnapshot.docs[0];
        const locationId = locationDoc.id;

        // Cập nhật review nếu có
        if (reviewData && (reviewData.review || reviewData.reviewNote)) {
          await this.updateLocation(locationId, reviewData);
        }

        return locationId;
      }

      // Tạo mới nếu chưa có
      return await this.addLocation({
        name,
        ...reviewData
      });
    } catch (error) {
      console.error('findOrCreateLocation error:', error);
      throw error;
    }
  }
};
