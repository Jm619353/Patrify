export const normalizeCnpj = (value: string | null | undefined): string =>
  (value ?? '').replace(/\D/g, '');

export const formatCnpj = (value: string | null | undefined): string => {
  const digits = normalizeCnpj(value);
  if (digits.length !== 14) return value ?? '—';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

export const isValidCnpj = (value: string | null | undefined): boolean => {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (slice: string): number => {
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
