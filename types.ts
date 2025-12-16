export interface Employee {
  id: string;
  name: string;
  phone: string;
  createdAt: string; // ISO date string
}

export interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  note?: string;
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
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  phone: string;
  unpaidCount: number;
  totalUnpaid: number;
}