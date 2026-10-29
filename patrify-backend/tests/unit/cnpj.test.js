const { expect } = require('chai');
const { normalizeCnpj, isValidCnpj, formatCnpj } = require('../../src/shared/utils/cnpj');

describe('utils/cnpj', () => {
  it('normaliza a máscara para apenas dígitos', () => {
    expect(normalizeCnpj('11.222.333/0001-81')).to.equal('11222333000181');
  });

  it('valida um CNPJ correto', () => {
    expect(isValidCnpj('11.222.333/0001-81')).to.equal(true);
  });

  it('rejeita CNPJ com dígito verificador inválido', () => {
    expect(isValidCnpj('11.222.333/0001-82')).to.equal(false);
  });

  it('rejeita CNPJ com tamanho incorreto', () => {
    expect(isValidCnpj('123')).to.equal(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(isValidCnpj('00000000000000')).to.equal(false);
  });

  it('formata um CNPJ válido', () => {
    expect(formatCnpj('11222333000181')).to.equal('11.222.333/0001-81');
  });
});
