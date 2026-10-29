const { expect } = require('chai');
const {
  CATEGORIES,
  CATEGORY_PREFIX,
  generateSerialNumber,
  generateUniqueSerialNumber
} = require('../../src/shared/utils/serial');

describe('utils/serial', () => {
  it('gera código com prefixo da categoria e 12 caracteres', () => {
    const serial = generateSerialNumber('Tecnologia');
    expect(serial).to.have.length(12);
    expect(serial.startsWith(CATEGORY_PREFIX.Tecnologia)).to.equal(true);
  });

  it('rejeita categoria desconhecida', () => {
    expect(() => generateSerialNumber('Categoria Inexistente')).to.throw('Categoria inválida');
  });

  it('gera códigos únicos quando há colisão', async () => {
    let calls = 0;
    const exists = async () => {
      calls += 1;
      return calls < 3;
    };
    const serial = await generateUniqueSerialNumber('Mobiliário', exists);
    expect(serial).to.have.length(12);
    expect(calls).to.equal(3);
  });

  it('expõe todas as categorias suportadas', () => {
    expect(CATEGORIES).to.include.members(['Tecnologia', 'Mobiliário', 'Logística']);
  });
});
