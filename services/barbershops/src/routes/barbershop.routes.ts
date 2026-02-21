import { Router } from 'express';
import { validateBody, validateQuery } from '@barbershop/shared';
import {
  listBarbershops,
  getBarbershop,
  createBarbershop,
  updateBarbershop,
  toggleBarbershopActive,
  deleteBarbershop,
} from '../controllers/barbershop.controller';
import {
  createBarbershopSchema,
  updateBarbershopSchema,
  listBarbershopsSchema,
} from '../validators/barbershop.validator';

const router = Router();

// GET  /                → list all barbershops (paginated, filterable)
// POST /                → create barbershop
// GET  /:id             → get single barbershop (with barbers + services)
// PUT  /:id             → full update
// PATCH /:id            → partial update
// PATCH /:id/toggle     → toggle active/inactive
// DELETE /:id           → delete (guards against active appointments)

router
  .route('/')
  .get(validateQuery(listBarbershopsSchema), listBarbershops)
  .post(validateBody(createBarbershopSchema), createBarbershop);

router
  .route('/:id')
  .get(getBarbershop)
  .put(validateBody(createBarbershopSchema), updateBarbershop)
  .patch(validateBody(updateBarbershopSchema), updateBarbershop)
  .delete(deleteBarbershop);

router.patch('/:id/toggle', toggleBarbershopActive);

export default router;
