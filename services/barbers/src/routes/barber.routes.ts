import { Router } from 'express';
import { validateBody, validateQuery } from '@barbershop/shared';
import {
  listBarbers, getBarber, createBarber, updateBarber,
  toggleBarberActive, getBarberStats, deleteBarber,
} from '../controllers/barber.controller';
import {
  createBarberSchema, updateBarberSchema, listBarbersSchema,
} from '../validators/barber.validator';

const router = Router();

router
  .route('/')
  .get(validateQuery(listBarbersSchema), listBarbers)
  .post(validateBody(createBarberSchema), createBarber);

router
  .route('/:id')
  .get(getBarber)
  .put(validateBody(createBarberSchema.omit({ branch_id: true })), updateBarber)
  .patch(validateBody(updateBarberSchema), updateBarber)
  .delete(deleteBarber);

router.patch('/:id/toggle', toggleBarberActive);
router.get('/:id/stats', getBarberStats);

export default router;
