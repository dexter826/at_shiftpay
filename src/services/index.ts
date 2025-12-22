import { employeeService } from './employeeService';
import { eventService } from './eventService';
import { shiftService } from './shiftService';
import { paymentService } from './paymentService';
import { settingsService } from './settingsService';

export const dbService = {
  ...employeeService,
  ...eventService,
  ...shiftService,
  ...paymentService,
  ...settingsService,
};

export { deleteField } from 'firebase/firestore';
