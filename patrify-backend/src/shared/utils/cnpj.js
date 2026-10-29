const normalizeCnpj = (value = '') => String(value).replace(/\D/g, '');

const isValidCnpj = (value) => {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (slice) => {
    let sum = 0;
    let position = slice.length - 7;
    for (let index = 0; index < slice.length; index += 1) {
      sum += Number(slice[index]) * position;
      position -= 1;
      if (position < 2) position = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12));
  const secondDigit = calculateDigit(cnpj.slice(0, 13));
  return cnpj === `${cnpj.slice(0, 12)}${firstDigit}${secondDigit}`;
};

const formatCnpj = (value) => {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

module.exports = { normalizeCnpj, isValidCnpj, formatCnpj };
