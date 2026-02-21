import { Router } from 'express';
import { validateBody, validateQuery } from '@barbershop/shared';
import {
  listServices, getService, createService, updateService,
  toggleServiceActive, deleteService,
} from '../controllers/service.controller';
import { createServiceSchema, updateServiceSchema, listServicesSchema } from '../validators/service.validator';

const router = Router();

router.route('/')
  .get(validateQuery(listServicesSchema), listServices)
  .post(validateBody(createServiceSchema), createService);

router.route('/:id')
  .get(getService)
  .put(validateBody(createServiceSchema), updateService)
  .patch(validateBody(updateServiceSchema), updateService)
  .delete(deleteService);

router.patch('/:id/toggle', toggleServiceActive);

export default router;
