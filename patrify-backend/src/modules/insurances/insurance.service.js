const ApiError = require('../../shared/errors/ApiError');
const patrimonyRepository = require('../patrimony/patrimony.repository');
const repository = require('./insurance.repository');

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
    type: 'Observação',
    description: `Apólice de seguro/garantia vinculada: ${payload.policyNumber} (${payload.insurer} - ${payload.coverageType}) · Vigência até ${payload.endDate}.`
  });

  return created;
};

const update = async (userId, id, payload) => {
  const existing = await repository.findById(userId, id);
  if (!existing) {
    throw ApiError.notFound('Apólice ou garantia não encontrada.', {
      code: 'INSURANCE_NOT_FOUND'
    });
  }

  const updated = await repository.update(userId, id, payload);

  if (payload.status === 'Sinistro Acionado' && existing.status !== 'Sinistro Acionado') {
    await patrimonyRepository.addMovement(userId, existing.patrimonyId, {
      type: 'Observação',
      description: `Sinistro acionado na apólice ${existing.policyNumber} (${existing.insurer})${
        payload.claimNotes ? ` · Ocorrência: ${payload.claimNotes}` : ''
      }.`
    });
  } else if (payload.endDate && payload.endDate !== existing.endDate) {
    await patrimonyRepository.addMovement(userId, existing.patrimonyId, {
      type: 'Observação',
      description: `Vigência da apólice ${existing.policyNumber} (${existing.insurer}) renovada até ${payload.endDate}.`
    });
  }

  return updated;
};

const remove = async (userId, id) => {
  const deleted = await repository.remove(userId, id);
  if (!deleted) {
    throw ApiError.notFound('Apólice ou garantia não encontrada.', {
      code: 'INSURANCE_NOT_FOUND'
    });
  }
};

module.exports = { list, create, update, remove };
