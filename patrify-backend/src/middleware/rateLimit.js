const rateLimit = require('express-rate-limit');
const ApiError = require('../shared/errors/ApiError');

const buildLimiter = ({ windowMs, limit, message, code }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new ApiError(429, message, {
          code
        })
      );
    }
  });

const globalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
  code: 'RATE_LIMITED'
});

const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.',
  code: 'LOGIN_RATE_LIMITED'
});

const recoveryLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Muitas solicitações de recuperação de senha. Tente novamente mais tarde.',
  code: 'RECOVERY_RATE_LIMITED'
});

module.exports = { globalLimiter, loginLimiter, recoveryLimiter };
