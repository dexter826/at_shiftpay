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
export type ShiftStatus = 'unpaid' | 'paid';

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

export interface PaymentTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: number; // timestamp
  shiftIds: string[];
  note?: string;
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  phone: string;
  unpaidCount: number;
  totalUnpaid: number;
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