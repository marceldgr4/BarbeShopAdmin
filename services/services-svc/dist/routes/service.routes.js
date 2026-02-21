"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@barbershop/shared");
const service_controller_1 = require("../controllers/service.controller");
const service_validator_1 = require("../validators/service.validator");
const router = (0, express_1.Router)();
router.route('/')
    .get((0, shared_1.validateQuery)(service_validator_1.listServicesSchema), service_controller_1.listServices)
    .post((0, shared_1.validateBody)(service_validator_1.createServiceSchema), service_controller_1.createService);
router.route('/:id')
    .get(service_controller_1.getService)
    .put((0, shared_1.validateBody)(service_validator_1.createServiceSchema), service_controller_1.updateService)
    .patch((0, shared_1.validateBody)(service_validator_1.updateServiceSchema), service_controller_1.updateService)
    .delete(service_controller_1.deleteService);
router.patch('/:id/toggle', service_controller_1.toggleServiceActive);
exports.default = router;
//# sourceMappingURL=service.routes.js.map