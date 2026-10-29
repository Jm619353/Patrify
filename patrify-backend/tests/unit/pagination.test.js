const { expect } = require('chai');
const { parsePagination, buildMeta } = require('../../src/shared/utils/pagination');
const { parseMoney } = require('../../src/shared/utils/money');

describe('utils/pagination', () => {
  it('usa valores padrão', () => {
    expect(parsePagination({})).to.deep.equal({ page: 1, pageSize: 10, offset: 0, limit: 10 });
  });

  it('limita o tamanho máximo da página', () => {
    expect(parsePagination({ page: '3', pageSize: '9999' })).to.deep.equal({
      page: 3,
      pageSize: 100,
      offset: 200,
      limit: 100
    });
  });

  it('calcula metadados de paginação', () => {
    const meta = buildMeta({ page: 2, pageSize: 10, total: 35 });
    expect(meta.totalPages).to.equal(4);
    expect(meta.hasNextPage).to.equal(true);
    expect(meta.hasPreviousPage).to.equal(true);
  });
});

describe('utils/money', () => {
  it('converte formato brasileiro', () => {
    expect(parseMoney('R$ 1.234,56')).to.equal(1234.56);
  });

  it('converte formato com ponto decimal', () => {
    expect(parseMoney('1234.56')).to.equal(1234.56);
  });

  it('trata valores vazios', () => {
    expect(parseMoney(null)).to.equal(0);
    expect(parseMoney('')).to.equal(0);
  });
});
