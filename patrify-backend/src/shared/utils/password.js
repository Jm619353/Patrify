const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

const passwordPolicy = (password = '') => {
  const errors = [];
  if (password.length < 8) errors.push('A senha deve ter pelo menos 8 caracteres.');
  if (password.length > 72) errors.push('A senha deve ter no máximo 72 caracteres.');
  if (!/[a-zA-Z]/.test(password)) errors.push('A senha deve conter ao menos uma letra.');
  if (!/\d/.test(password)) errors.push('A senha deve conter ao menos um número.');
  return { valid: errors.length === 0, errors };
};

module.exports = { hashPassword, comparePassword, passwordPolicy };
