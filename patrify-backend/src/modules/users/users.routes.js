const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const service = require('./users.service');
const { updateProfileSchema } = require('./users.schemas');

const router = express.Router();

router.use(authenticate);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const data = await service.getProfile(req.user.id);
    res.json({ data });
  })
);

router.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const data = await service.updateProfile(req.user.id, req.body);
    res.json({ data });
  })
);

module.exports = router;
