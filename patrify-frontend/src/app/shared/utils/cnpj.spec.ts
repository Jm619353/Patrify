import { formatCnpj, isValidCnpj, normalizeCnpj } from './cnpj';

describe('CNPJ utils', () => {
  const validCnpj = '11.222.333/0001-81';

  it('normaliza a máscara para apenas dígitos', () => {
    expect(normalizeCnpj(validCnpj)).toBe('11222333000181');
    expect(normalizeCnpj(null)).toBe('');
  });

  it('valida um CNPJ correto', () => {
    expect(isValidCnpj(validCnpj)).toBeTrue();
    expect(isValidCnpj('11222333000181')).toBeTrue();
  });

  it('rejeita CNPJ com dígito verificador inválido', () => {
    expect(isValidCnpj('11222333000182')).toBeFalse();
  });

  it('rejeita CNPJ com tamanho incorreto', () => {
    expect(isValidCnpj('1122233300018')).toBeFalse();
    expect(isValidCnpj('')).toBeFalse();
  });

  it('rejeita sequências repetidas', () => {
    expect(isValidCnpj('11111111111111')).toBeFalse();
  });

  it('formata um CNPJ válido', () => {
    expect(formatCnpj('11222333000181')).toBe(validCnpj);
  });

  it('mantém o valor original quando o CNPJ está incompleto', () => {
    expect(formatCnpj('123')).toBe('123');
    expect(formatCnpj(null)).toBe('—');
  });
});
