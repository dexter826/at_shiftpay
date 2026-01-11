import { db } from '../firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { UserSettings, DEFAULT_SETTINGS } from '../types';

export const settingsService = {
  subscribeSettings(userId: string, callback: (settings: UserSettings) => void): Unsubscribe {
    const docRef = doc(db, 'settings', userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserSettings);
      } else {
        callback({ ...DEFAULT_SETTINGS, userId });
      }
    });
  },

  async updateSettings(userId: string, data: Partial<UserSettings>): Promise<void> {
    try {
      const docRef = doc(db, 'settings', userId);
      await setDoc(docRef, { ...data, userId }, { merge: true });
    } catch (error) {
      console.error('updateSettings error:', error);
      throw new Error(`Không thể cập nhật cài đặt: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  },
};
