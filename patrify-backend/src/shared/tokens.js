const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./errors/ApiError');

const baseOptions = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE
};

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      cnpj: user.cnpj,
      email: user.email,
      role: user.role || 'admin',
      plan: user.plan || 'enterprise',
      purpose: 'access'
    },
    env.jwtSecret,
    { ...baseOptions, expiresIn: env.JWT_EXPIRES_IN }
  );

const signPasswordResetToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      purpose: 'password_reset'
    },
    env.jwtSecret,
    { ...baseOptions, expiresIn: '15m' }
  );

const verifyToken = (token, { purpose } = {}) => {
  try {
    const payload = jwt.verify(token, env.jwtSecret, baseOptions);
    if (purpose && payload.purpose !== purpose) {
      throw ApiError.unauthorized('Token inválido para esta operação.', { code: 'INVALID_TOKEN' });
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expirado. Faça login novamente.', {
        code: 'TOKEN_EXPIRED'
      });
    }
    throw ApiError.unauthorized('Token inválido.', { code: 'INVALID_TOKEN' });
  }
};

module.exports = { signAccessToken, signPasswordResetToken, verifyToken };
