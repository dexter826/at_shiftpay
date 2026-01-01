import { employeeService } from './employeeService';
import { eventService } from './eventService';
import { shiftService } from './shiftService';
import { paymentService } from './paymentService';
import { settingsService } from './settingsService';
import { locationService } from './locationService';

export const dbService = {
  ...employeeService,
  ...eventService,
  ...shiftService,
  ...paymentService,
  ...settingsService,
  ...locationService,
};

export { deleteField } from 'firebase/firestore';
