const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, requirePlan } = require('../../middleware/auth');
const service = require('./maintenance.service');
const {
  idSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  listMaintenanceQuerySchema
} = require('./maintenance.schemas');

const router = express.Router();

router.use(authenticate, requirePlan('pro'));

router.get(
  '/',
  validate({ query: listMaintenanceQuerySchema }),
  asyncHandler(async (req, res) => {
    const { items, summary } = await service.list(req.user.id, req.validatedQuery);
    res.json({ data: items, meta: summary });
  })
);

router.post(
  '/',
  validate({ body: createMaintenanceSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.create(req.user.id, req.body);
    res.status(201).json({ data });
  })
);

router.patch(
  '/:id',
  validate({ params: idSchema, body: updateMaintenanceSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.update(req.user.id, req.params.id, req.body);
    res.json({ data });
  })
);

router.delete(
  '/:id',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    await service.remove(req.user.id, req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
