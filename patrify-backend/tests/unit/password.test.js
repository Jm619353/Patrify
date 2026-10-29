const { expect } = require('chai');
const { hashPassword, comparePassword, passwordPolicy } = require('../../src/shared/utils/password');

describe('utils/password', () => {
  it('gera hash e compara corretamente', async () => {
    const hash = await hashPassword('SenhaSegura123');
    expect(hash).to.not.equal('SenhaSegura123');
    expect(await comparePassword('SenhaSegura123', hash)).to.equal(true);
    expect(await comparePassword('SenhaErrada123', hash)).to.equal(false);
  });

  it('aplica política mínima de senha', () => {
    expect(passwordPolicy('123').valid).to.equal(false);
    expect(passwordPolicy('somenteletras').valid).to.equal(false);
    expect(passwordPolicy('Senha123').valid).to.equal(true);
  });
});
