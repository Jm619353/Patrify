const express = require('express');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { loginLimiter, recoveryLimiter } = require('../../middleware/rateLimit');
const controller = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('./auth.schemas');
const { z } = require('zod');
const { passwordSchema } = require('./auth.schemas');

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', loginLimiter, validate({ body: loginSchema }), controller.login);
router.get('/me', authenticate, controller.me);

router.post(
  '/forgot-password',
  recoveryLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword
);
router.post(
  '/reset-password',
  recoveryLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword
);
router.patch(
  '/change-password',
  authenticate,
  validate({
    body: z.object({
      currentPassword: z.string().min(1, 'Senha atual é obrigatória.'),
      newPassword: passwordSchema
    })
  }),
  controller.changePassword
);

module.exports = router;
