import { employeeService } from './employeeService';
import { eventService } from './eventService';
import { shiftService } from './shiftService';
import { paymentService } from './paymentService';
import { settingsService } from './settingsService';
import { locationService } from './locationService';
import { imageService } from './imageService';

export const dbService = {
  ...employeeService,
  ...eventService,
  ...shiftService,
  ...paymentService,
  ...settingsService,
  ...locationService,
  ...imageService,
};

export { deleteField } from 'firebase/firestore';
