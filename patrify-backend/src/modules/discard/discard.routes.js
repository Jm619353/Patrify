const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { searchSchema } = require('./discard.schemas');
const service = require('./discard.service');

const router = express.Router();

router.use(authenticate);

router.post(
  '/search',
  validate({ body: searchSchema }),
  asyncHandler(async (req, res) => {
    const { items, cached } = await service.search(req.body);
    res.json({
      data: items,
      meta: {
        total: items.length,
        cached
      }
    });
  })
);

module.exports = router;
