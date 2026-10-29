const ApiError = require('../../shared/errors/ApiError');
const patrimonyRepository = require('../patrimony/patrimony.repository');
const repository = require('./loan.repository');

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
    type: 'Transferência',
    description: `Empréstimo (Check-out) para ${payload.borrowerName} (${payload.department}) · Finalidade: ${payload.purpose} · Devolução prevista: ${payload.expectedReturnDate}`,
    responsible: `${payload.borrowerName} - ${payload.department}`
  });

  return created;
};

const update = async (userId, id, payload) => {
  const existing = await repository.findById(userId, id);
  if (!existing) {
    throw ApiError.notFound('Registro de empréstimo não encontrado.', {
      code: 'LOAN_NOT_FOUND'
    });
  }

  const updated = await repository.update(userId, id, payload);

  if (payload.status === 'Devolvido' && existing.status !== 'Devolvido') {
    await patrimonyRepository.addMovement(userId, existing.patrimonyId, {
      type: 'Transferência',
      description: `Devolução de empréstimo (Check-in) realizada por ${existing.borrowerName} (${existing.department})${
        updated.conditionIn ? ` · Estado na devolução: ${updated.conditionIn}` : ''
      }.`,
      responsible: 'Estoque / Setor de Origem'
    });
  } else if (
    payload.expectedReturnDate &&
    payload.expectedReturnDate !== existing.expectedReturnDate
  ) {
    await patrimonyRepository.addMovement(userId, existing.patrimonyId, {
      type: 'Observação',
      description: `Prazo de empréstimo com ${existing.borrowerName} renovado para ${payload.expectedReturnDate}.`
    });
  }

  return updated;
};

const remove = async (userId, id) => {
  const deleted = await repository.remove(userId, id);
  if (!deleted) {
    throw ApiError.notFound('Registro de empréstimo não encontrado.', {
      code: 'LOAN_NOT_FOUND'
    });
  }
};

module.exports = { list, create, update, remove };
