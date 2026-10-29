const ApiError = require('../../shared/errors/ApiError');
const patrimonyRepository = require('../patrimony/patrimony.repository');
const repository = require('./maintenance.repository');

const list = (userId, filters) => repository.list(userId, filters);

const create = async (userId, payload) => {
  const patrimony = await patrimonyRepository.findById(userId, payload.patrimonyId);
  if (!patrimony) {
    throw ApiError.notFound('Patrimônio selecionado não encontrado.', {
      code: 'PATRIMONY_NOT_FOUND'
    });
  }

  const created = await repository.create(userId, patrimony, payload);

  await patrimonyRepository.addMovement(userId, patrimony.id, {
    type: 'Manutenção',
    description: `Ordem de manutenção (${payload.type}) registrada: ${payload.title}${
      payload.provider ? ` · Prestador: ${payload.provider}` : ''
    }`
  });

  return created;
};

const update = async (userId, id, payload) => {
  const existing = await repository.findById(userId, id);
  if (!existing) {
    throw ApiError.notFound('Ordem de manutenção não encontrada.', {
      code: 'MAINTENANCE_NOT_FOUND'
    });
  }

  const updated = await repository.update(userId, id, payload);

  if (payload.status && payload.status !== existing.status) {
    await patrimonyRepository.addMovement(userId, existing.patrimonyId, {
      type: 'Manutenção',
      description: `Status da manutenção "${updated.title}" alterado para ${payload.status}.`
    });
  }

  return updated;
};

const remove = async (userId, id) => {
  const deleted = await repository.remove(userId, id);
  if (!deleted) {
    throw ApiError.notFound('Ordem de manutenção não encontrada.', {
      code: 'MAINTENANCE_NOT_FOUND'
    });
  }
};

module.exports = { list, create, update, remove };
