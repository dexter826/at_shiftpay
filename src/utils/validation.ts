import { z } from 'zod';

export const BankAccountSchema = z.object({
  bankId: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
});

export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên không được để trống'),
  phone: z.string().default(''),
  imageUrl: z.string().optional(),
  bankAccount: BankAccountSchema.optional(),
  createdAt: z.string(),
  userId: z.string(),
});

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên địa điểm không được để trống'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  review: z.enum(['high', 'low']).optional(),
  reviewNote: z.string().optional(),
  createdAt: z.string(),
  userId: z.string(),
});

export const EventSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string().optional(),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  note: z.string().optional(),
  amount: z.number().optional(),
  surcharge: z.number().optional(),
  surchargeDistribution: z.object({
    type: z.enum(['equal', 'selected']),
    selectedEmployeeIds: z.array(z.string()).optional(),
  }).optional(),
  locationId: z.string().optional(),
  userId: z.string(),
});

export const ShiftSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  date: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  session: z.enum(['morning', 'afternoon']),
  amount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
  status: z.enum(['unpaid', 'paid', 'advanced']),
  paidAt: z.number().nullable().optional(),
  paymentId: z.string().optional(),
  userId: z.string(),
});

export const PaymentTransactionSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  amount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
  date: z.number(),
  shiftIds: z.array(z.string()),
  note: z.string().optional(),
  type: z.enum(['regular', 'advance', 'settlement']),
  settledAt: z.number().optional(),
  settledBy: z.string().optional(),
  userId: z.string(),
});

export const UserSettingsSchema = z.object({
  shiftRate: z.number().min(0, 'Mức lương phải lớn hơn 0'),
  morningTime: z.string(),
  afternoonTime: z.string(),
  userId: z.string(),
});

export function validateEmployee(data: unknown) {
  return EmployeeSchema.parse(data);
}

export function validateEvent(data: unknown) {
  return EventSchema.parse(data);
}

export function validateShift(data: unknown) {
  return ShiftSchema.parse(data);
}

export function validatePaymentTransaction(data: unknown) {
  return PaymentTransactionSchema.parse(data);
}

export function validateUserSettings(data: unknown) {
  return UserSettingsSchema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('Validation failed for data:', data, 'Errors:', result.error.issues);
    return null;
  }
  return result.data;
}
