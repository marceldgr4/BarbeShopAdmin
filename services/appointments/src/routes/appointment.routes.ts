import { Router } from 'express';
import {
  listAppointments, getAppointment,
  updateAppointmentStatus, getTodayAgenda,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/',        listAppointments);
router.get('/today',   getTodayAgenda);
router.get('/:id',     getAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
