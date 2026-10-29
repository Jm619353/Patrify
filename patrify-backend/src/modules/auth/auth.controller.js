const asyncHandler = require('../../shared/utils/asyncHandler');
const service = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const data = await service.register(req.body);
  res.status(201).json({ data });
});

const login = asyncHandler(async (req, res) => {
  const data = await service.login(req.body);
  res.status(200).json({ data });
});

const me = asyncHandler(async (req, res) => {
  const data = await service.me(req.user.id);
  res.status(200).json({ data });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await service.requestPasswordReset(req.body);
  res.status(200).json({
    data: {
      message:
        'Se os dados informados estiverem corretos, enviaremos um link de recuperação para o e-mail cadastrado.'
    }
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await service.resetPassword(req.body);
  res.status(200).json({ data });
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await service.changePassword(req.user.id, req.body);
  res.status(200).json({ data });
});

module.exports = { register, login, me, forgotPassword, resetPassword, changePassword };
