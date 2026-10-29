const crypto = require('crypto');

const CATEGORY_PREFIX = Object.freeze({
  Tecnologia: 'TECH',
  Mobiliário: 'MOBL',
  Industrial: 'INDU',
  Transporte: 'TRAN',
  Logística: 'LOGI',
  Segurança: 'SEGU',
  Laboratorial: 'LABO',
  Produção: 'PROD'
});

const CATEGORIES = Object.freeze(Object.keys(CATEGORY_PREFIX));

const generateSerialNumber = (category) => {
  const prefix = CATEGORY_PREFIX[category];
  if (!prefix) {
    throw new Error(`Categoria inválida: ${category}`);
  }

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 12 - prefix.length;
  let serial = prefix;

  for (let index = 0; index < length; index += 1) {
    serial += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return serial;
};

const generateUniqueSerialNumber = async (category, exists) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const serial = generateSerialNumber(category);
    // eslint-disable-next-line no-await-in-loop
    if (!(await exists(serial))) return serial;
  }
  throw new Error('Não foi possível gerar um código de série único.');
};

module.exports = { CATEGORIES, CATEGORY_PREFIX, generateSerialNumber, generateUniqueSerialNumber };
