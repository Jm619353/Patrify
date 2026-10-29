const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const service = require('./patrimony.service');
const {
  idSchema,
  serialParamSchema,
  createSchema,
  updateSchema,
  movementSchema,
  listQuerySchema,
  CATEGORIES,
  STATUSES,
  CONDITIONS,
  SORT_FIELDS,
  MOVEMENT_TYPES
} = require('./patrimony.schemas');

const router = express.Router();
const publicRouter = express.Router();

publicRouter.get(
  '/:serial',
  validate({ params: serialParamSchema }),
  asyncHandler(async (req, res) => {
    const origin = req.headers.origin || undefined;
    const data = await service.getPublicBySerial(req.params.serial, origin);
    res.json({ data });
  })
);

router.use(authenticate);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const data = await service.getSummary(req.user.id);
    res.json({ data });
  })
);

router.get('/metadata', (req, res) => {
  res.json({
    data: {
      categories: CATEGORIES,
      statuses: STATUSES,
      conditions: CONDITIONS,
      sortFields: SORT_FIELDS,
      movementTypes: MOVEMENT_TYPES
    }
  });
});

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const { items, meta } = await service.list(req.user.id, req.validatedQuery);
    res.json({ data: items, meta });
  })
);

router.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.create(req.user.id, req.body);
    res.status(201).json({ data });
  })
);

router.get(
  '/:id',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.getById(req.user.id, req.params.id);
    res.json({ data });
  })
);

router.get(
  '/:id/qrcode',
  validate({ params: idSchema }),
  asyncHandler(async (req, res) => {
    const origin = req.headers.origin || undefined;
    const data = await service.getQrCode(req.user.id, req.params.id, origin);
    res.json({ data });
  })
);

router.post(
  '/:id/movements',
  validate({ params: idSchema, body: movementSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.addMovement(req.user.id, req.params.id, req.body);
    res.status(201).json({ data });
  })
);

router.patch(
  '/:id',
  validate({ params: idSchema, body: updateSchema }),
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

router.post(
  '/:id/image',
  validate({ params: idSchema }),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const data = await service.uploadImage(req.user.id, req.params.id, req.file);
    res.json({ data });
  })
);

module.exports = router;
module.exports.publicRouter = publicRouter;
