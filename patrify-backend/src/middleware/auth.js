const ApiError = require('../shared/errors/ApiError');
const { verifyToken } = require('../shared/tokens');

const PLAN_LEVELS = {
  basic: 1,
  pro: 2,
  enterprise: 3
};

const PLAN_LABELS = {
  basic: 'Plano Básico',
  pro: 'Plano Profissional',
  enterprise: 'Plano Enterprise'
};

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(
      ApiError.unauthorized('Token de acesso não informado.', { code: 'MISSING_TOKEN' })
    );
  }

  try {
    const payload = verifyToken(token, { purpose: 'access' });
    req.user = {
      id: String(payload.sub),
      cnpj: payload.cnpj,
      email: payload.email,
      role: payload.role || 'admin',
      plan: payload.plan || 'enterprise'
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(
      ApiError.forbidden(
        'Acesso restrito. Apenas o Administrador do Sistema pode realizar esta operação.',
        { code: 'ADMIN_ONLY' }
      )
    );
  }
  return next();
};

const requirePlan = (minPlan) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Não autenticado.', { code: 'MISSING_TOKEN' }));
  }
  if (req.user.role === 'admin') {
    return next();
  }
  const userLevel = PLAN_LEVELS[req.user.plan || 'basic'] || 1;
  const requiredLevel = PLAN_LEVELS[minPlan] || 1;
  if (userLevel < requiredLevel) {
    return next(
      ApiError.forbidden(
        `Este recurso está disponível apenas a partir do ${PLAN_LABELS[minPlan] || minPlan}. Solicite o upgrade do seu plano ao Administrador do Sistema.`,
        { code: 'PLAN_UPGRADE_REQUIRED' }
      )
    );
  }
  return next();
};

module.exports = { authenticate, requireAdmin, requirePlan, PLAN_LEVELS, PLAN_LABELS };
