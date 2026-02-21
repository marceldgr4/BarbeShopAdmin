"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@barbershop/shared");
const barbershop_controller_1 = require("../controllers/barbershop.controller");
const barbershop_validator_1 = require("../validators/barbershop.validator");
const router = (0, express_1.Router)();
// GET  /                → list all barbershops (paginated, filterable)
// POST /                → create barbershop
// GET  /:id             → get single barbershop (with barbers + services)
// PUT  /:id             → full update
// PATCH /:id            → partial update
// PATCH /:id/toggle     → toggle active/inactive
// DELETE /:id           → delete (guards against active appointments)
router
    .route('/')
    .get((0, shared_1.validateQuery)(barbershop_validator_1.listBarbershopsSchema), barbershop_controller_1.listBarbershops)
    .post((0, shared_1.validateBody)(barbershop_validator_1.createBarbershopSchema), barbershop_controller_1.createBarbershop);
router
    .route('/:id')
    .get(barbershop_controller_1.getBarbershop)
    .put((0, shared_1.validateBody)(barbershop_validator_1.createBarbershopSchema), barbershop_controller_1.updateBarbershop)
    .patch((0, shared_1.validateBody)(barbershop_validator_1.updateBarbershopSchema), barbershop_controller_1.updateBarbershop)
    .delete(barbershop_controller_1.deleteBarbershop);
router.patch('/:id/toggle', barbershop_controller_1.toggleBarbershopActive);
exports.default = router;
//# sourceMappingURL=barbershop.routes.js.map