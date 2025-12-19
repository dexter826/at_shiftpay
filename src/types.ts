export interface Employee {
  id: string;
  name: string;
  phone: string;
  imageUrl?: string;
  createdAt: string; // ISO date string
}

export interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  note?: string;
  amount?: number; // Salary rate for this event
}

export type ShiftSession = 'morning' | 'afternoon';
export type ShiftStatus = 'unpaid' | 'paid' | 'advanced';

export interface Shift {
  id: string;
  eventId: string;
  eventDate: string;
  employeeId: string;
  employeeName: string;
  session: ShiftSession;
  amount: number;
  status: ShiftStatus;
  paidAt?: number | null;
  paymentId?: string; // Reference to the payment transaction
}

export type PaymentType = 'regular' | 'advance' | 'settlement';

export interface PaymentTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: number; // timestamp
  shiftIds: string[];
  note?: string;
  type: PaymentType; // Loại thanh toán
  isAdvance?: boolean; // Có phải tiền ứng không (deprecated, dùng type)
  settledAt?: number; // Thời điểm quyết toán (nếu là advance)
  settledBy?: string; // ID của transaction quyết toán
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  phone: string;
  unpaidCount: number;
  totalUnpaid: number;
  advancedCount: number; // Số ca đã ứng
  totalAdvanced: number; // Tổng tiền đã ứng
  netAmount: number; // Số tiền thực tế cần trả (unpaid - advanced)
}

export interface AdvanceBalance {
  employeeId: string;
  employeeName: string;
  totalAdvanced: number; // Tổng tiền đã ứng
  totalEarned: number; // Tổng tiền đã làm (bao gồm cả unpaid)
  balance: number; // Số dư (âm = còn nợ manager, dương = manager nợ nhân viên)
}

export interface UserSettings {
  shiftRate: number;
  morningTime: string;
  afternoonTime: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  shiftRate: 250000,
  morningTime: '07:30',
  afternoonTime: '13:30',
};