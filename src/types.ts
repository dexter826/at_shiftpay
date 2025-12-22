export interface BankAccount {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  imageUrl?: string;
  bankAccount?: BankAccount;
  createdAt: string; // Chuỗi ISO 8601
}

export interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  note?: string;
  amount?: number; // Mức lương sự kiện
  surcharge?: number; // Phụ phí sự kiện (cố định, không nhân với số người)
  surchargeDistribution?: {
    type: 'equal' | 'selected';
    selectedEmployeeIds?: string[]; // chỉ có khi type = 'selected'
  };
  review?: 'high' | 'low'; // Đánh giá sự kiện
  reviewNote?: string; // Ghi chú riêng cho phần đánh giá
  location?: string; // Địa điểm tổ chức
}

export type ShiftSession = 'morning' | 'afternoon';
export type ShiftStatus = 'unpaid' | 'paid' | 'advanced';

export interface Shift {
  id: string;
  eventId: string;
  date: string;
  employeeId: string;
  employeeName: string;
  session: ShiftSession;
  amount: number;
  status: ShiftStatus;
  paidAt?: number | null;
  paymentId?: string;
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
  settledAt?: number; // Thời điểm hoàn ứng
  settledBy?: string; // ID giao dịch hoàn ứng
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  phone: string;
  unpaidCount: number;
  totalUnpaid: number;
  advancedCount: number; // Số ca đã ứng
  totalAdvanced: number; // Tổng tiền đã ứng
  netAmount: number; // Thực nhận (unpaid - advanced)
}

export interface AdvanceBalance {
  employeeId: string;
  employeeName: string;
  totalAdvanced: number; // Tổng tiền đã ứng
  totalEarned: number; // Tổng thu nhập (gồm chưa thanh toán)
  balance: number; // Âm: nợ quản lý, Dương: quản lý nợ
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