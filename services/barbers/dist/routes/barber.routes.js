"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@barbershop/shared");
const barber_controller_1 = require("../controllers/barber.controller");
const barber_validator_1 = require("../validators/barber.validator");
const router = (0, express_1.Router)();
router
    .route('/')
    .get((0, shared_1.validateQuery)(barber_validator_1.listBarbersSchema), barber_controller_1.listBarbers)
    .post((0, shared_1.validateBody)(barber_validator_1.createBarberSchema), barber_controller_1.createBarber);
router
    .route('/:id')
    .get(barber_controller_1.getBarber)
    .put((0, shared_1.validateBody)(barber_validator_1.createBarberSchema.omit({ branch_id: true })), barber_controller_1.updateBarber)
    .patch((0, shared_1.validateBody)(barber_validator_1.updateBarberSchema), barber_controller_1.updateBarber)
    .delete(barber_controller_1.deleteBarber);
router.patch('/:id/toggle', barber_controller_1.toggleBarberActive);
router.get('/:id/stats', barber_controller_1.getBarberStats);
exports.default = router;
//# sourceMappingURL=barber.routes.js.map