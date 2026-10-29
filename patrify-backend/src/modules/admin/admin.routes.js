const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./admin.service');
const {
  idSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  listAdminPatrimoniesQuerySchema,
  createAdminPatrimonySchema,
  updateAdminPatrimonySchema
} = require('./admin.schemas');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const data = await service.getOverview(req.query.search || '');
    res.json({ data });
  })
);

router.post(
  '/users',
  validate({ body: createAdminUserSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.createUser(req.body);
    res.status(201).json({ data });
  })
);

router.patch(
  '/users/:id',
  validate({ params: idSchema, body: updateAdminUserSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.updateUser(req.params.id, req.body);
    res.json({ data });
  })
);

router.delete(
  '/users/:id',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    await service.deleteUser(req.params.id, req.user.id);
    res.status(204).send();
  })
);

router.post(
  '/users/:id/impersonate',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.impersonateUser(req.params.id);
    res.json({ data });
  })
);

router.get(
  '/patrimonies',
  validate({ query: listAdminPatrimoniesQuerySchema }),
  asyncHandler(async (req, res) => {
    const data = await service.listAllPatrimonies(req.validatedQuery);
    res.json({ data });
  })
);

router.post(
  '/patrimonies',
  validate({ body: createAdminPatrimonySchema }),
  asyncHandler(async (req, res) => {
    const data = await service.createPatrimonyForUser(req.body);
    res.status(201).json({ data });
  })
);

router.patch(
  '/patrimonies/:id',
  validate({ params: idSchema, body: updateAdminPatrimonySchema }),
  asyncHandler(async (req, res) => {
    const data = await service.updateAnyPatrimony(req.params.id, req.body);
    res.json({ data });
  })
);

router.delete(
  '/patrimonies/:id',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    await service.deleteAnyPatrimony(req.params.id);
    res.status(204).send();
  })
);

module.exports = router;
