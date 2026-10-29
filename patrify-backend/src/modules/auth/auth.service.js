const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const logger = require('../../config/logger');
const ApiError = require('../../shared/errors/ApiError');
const { hashPassword, comparePassword, passwordPolicy } = require('../../shared/utils/password');
const { signAccessToken, signPasswordResetToken, verifyToken } = require('../../shared/tokens');
const { sendPasswordResetEmail, isMailConfigured } = require('../../shared/mailer');
const repository = require('./auth.repository');

// Hash descartável usado para equalizar o tempo de resposta quando o CNPJ não existe.
const DUMMY_HASH = bcrypt.hashSync('invalid-password-for-timing', 12);

const register = async () => {
  throw ApiError.forbidden(
    'O auto-cadastro de empresas está desabilitado. Apenas o Administrador do Sistema pode registrar novas contas.',
    { code: 'SELF_REGISTRATION_DISABLED' }
  );
};

const login = async ({ cnpj, password }) => {
  const user = await repository.findByCnpj(cnpj);

  if (!user) {
    // Mantém tempo de resposta semelhante para evitar enumeração de CNPJ.
    await comparePassword(password, DUMMY_HASH);
    throw ApiError.unauthorized('CNPJ ou senha inválidos.', { code: 'INVALID_CREDENTIALS' });
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('CNPJ ou senha inválidos.', { code: 'INVALID_CREDENTIALS' });
  }

  if (user.active === false) {
    throw ApiError.forbidden(
      'Esta conta empresarial encontra-se suspensa pelo administrador do sistema.',
      { code: 'ACCOUNT_SUSPENDED' }
    );
  }

  const updatedUser = (await repository.updateLastLogin(user._id)) || user;
  const dto = repository.toUserDto(updatedUser);

  return { user: dto, token: signAccessToken(dto) };
};

const me = async (userId) => {
  const user = await repository.findById(userId);
  if (!user) throw ApiError.unauthorized('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  return repository.toUserDto(user);
};

const requestPasswordReset = async ({ cnpj, email }) => {
  const user = await repository.findByCnpj(cnpj);

  // Resposta genérica para não revelar se o par CNPJ/e-mail existe.
  if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
    return { delivered: false };
  }

  const token = signPasswordResetToken({
    id: String(user._id),
    email: user.email
  });
  const resetUrl = `${env.FRONTEND_URL}/recsenha?token=${encodeURIComponent(token)}`;

  if (!isMailConfigured) {
    logger.warn({ resetUrl }, 'SMTP não configurado: link de recuperação gerado apenas para log');
  }

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl
  });

  return { delivered: true };
};

const resetPassword = async ({ token, password }) => {
  const payload = verifyToken(token, { purpose: 'password_reset' });
  const userId = String(payload.sub);
  const user = await repository.findById(userId);

  if (!user || user.email.toLowerCase() !== String(payload.email).toLowerCase()) {
    throw ApiError.badRequest('Token de recuperação inválido.', { code: 'INVALID_RESET_TOKEN' });
  }

  const changedAt = await repository.getPasswordChangedAt(userId);
  if (changedAt && payload.iat * 1000 < new Date(changedAt).getTime()) {
    throw ApiError.badRequest('Este link de recuperação já foi utilizado.', {
      code: 'RESET_TOKEN_USED'
    });
  }

  const passwordHash = await hashPassword(password);
  await repository.updatePassword(userId, passwordHash);

  return { message: 'Senha redefinida com sucesso.' };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await repository.findById(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized('Senha atual incorreta.', { code: 'INVALID_CURRENT_PASSWORD' });
  }

  const policy = passwordPolicy(newPassword);
  if (!policy.valid) {
    throw ApiError.unprocessable('A nova senha não atende à política de segurança.', {
      code: 'WEAK_PASSWORD',
      details: policy.errors.map((message) => ({ field: 'newPassword', message }))
    });
  }

  if (await comparePassword(newPassword, user.passwordHash)) {
    throw ApiError.unprocessable('A nova senha deve ser diferente da senha atual.', {
      code: 'SAME_PASSWORD'
    });
  }

  await repository.updatePassword(userId, await hashPassword(newPassword));
  return { message: 'Senha alterada com sucesso.' };
};

module.exports = {
  register,
  login,
  me,
  requestPasswordReset,
  resetPassword,
  changePassword
};
