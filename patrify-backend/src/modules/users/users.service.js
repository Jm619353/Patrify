const ApiError = require('../../shared/errors/ApiError');
const repository = require('./users.repository');

const getProfile = async (userId) => {
  const user = await repository.findById(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  return repository.toUserDto(user);
};

const updateProfile = async (userId, payload) => {
  const user = await repository.updateProfile(userId, payload);
  if (!user) throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  return repository.toUserDto(user);
};

module.exports = { getProfile, updateProfile };
