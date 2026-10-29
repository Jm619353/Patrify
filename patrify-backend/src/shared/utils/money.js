/**
 * Converte valores monetários recebidos da API/banco para número.
 * Aceita "1.234,56", "1234.56" e number.
 */
const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  const sanitized = raw.replace(/[^\d,.-]/g, '');
  const normalized =
    sanitized.includes(',') && sanitized.includes('.')
      ? sanitized.replace(/\./g, '').replace(',', '.')
      : sanitized.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports = { parseMoney, roundMoney };
