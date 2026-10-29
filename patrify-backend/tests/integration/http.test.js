process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters-long';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/patrify_test';
process.env.MONGODB_DB_NAME = 'patrify_test';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { getCollection, ensureIndexes, close } = require('../../src/config/database');
const { hashPassword } = require('../../src/shared/utils/password');

describe('HTTP / API (MongoDB)', () => {
  before(async () => {
    await ensureIndexes();
    const users = await getCollection('users');
    const patrimonies = await getCollection('patrimonies');
    const maintenances = await getCollection('maintenances');
    const loans = await getCollection('loans');
    const insurances = await getCollection('insurances');
    await Promise.all([
      users.deleteMany({}),
      patrimonies.deleteMany({}),
      maintenances.deleteMany({}),
      loans.deleteMany({}),
      insurances.deleteMany({})
    ]);

    const now = new Date();
    const passwordHash = await hashPassword('Patrify@2024');
    await users.insertOne({
      name: 'Empresa Teste',
      legalName: 'Empresa Teste LTDA',
      cnpj: '11222333000181',
      email: 'teste@patrify.app',
      passwordHash,
      phone1: '11999990000',
      phone2: null,
      address: 'Av. Paulista, 1000',
      economicActivity: 'Tecnologia',
      branchType: 'Matriz',
      companySize: 'Médio porte',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      passwordChangedAt: null
    });
  });

  after(async () => {
    await close();
  });

  it('verifica saúde da API e conexão com o MongoDB', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).to.equal(200);
    expect(response.body.data.status).to.equal('ok');
    expect(response.body.data.database).to.equal('connected');
  });

  it('responde 404 com envelope de erro em rotas inexistentes', async () => {
    const response = await request(app).get('/api/nao-existe');
    expect(response.status).to.equal(404);
    expect(response.body.error.code).to.equal('ROUTE_NOT_FOUND');
  });

  it('bloqueia acesso sem token', async () => {
    const response = await request(app).get('/api/patrimonies');
    expect(response.status).to.equal(401);
    expect(response.body.error.code).to.equal('MISSING_TOKEN');
  });

  it('valida payload de login', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.status).to.equal(422);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
    expect(response.body.error.details).to.be.an('array');
  });

  it('rejeita CNPJ inválido no login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cnpj: '11.111.111/1111-11', password: 'Senha123' });
    expect(response.status).to.equal(422);
  });

  it('autentica usuário e executa ciclo completo de patrimônios no MongoDB', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ cnpj: '11.222.333/0001-81', password: 'Patrify@2024' });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body.data.token).to.be.a('string');
    expect(loginRes.body.data.user.id).to.match(/^[a-f0-9]{24}$/i);

    const { token } = loginRes.body.data;
    const authHeader = `Bearer ${token}`;

    const createRes = await request(app)
      .post('/api/patrimonies')
      .set('Authorization', authHeader)
      .send({
        name: 'MacBook Pro M3',
        value: 14500.5,
        purchaseDate: '2024-05-10',
        location: 'Escritório SP',
        status: 'Ativo',
        condition: 'Novo',
        category: 'Tecnologia',
        quantity: 2
      });

    expect(createRes.status).to.equal(201);
    expect(createRes.body.data.id).to.match(/^[a-f0-9]{24}$/i);
    expect(createRes.body.data.serialNumber).to.match(/^TECH[A-Z0-9]{8}$/);

    const patrimonyId = createRes.body.data.id;

    const listRes = await request(app)
      .get('/api/patrimonies?search=MacBook')
      .set('Authorization', authHeader);

    expect(listRes.status).to.equal(200);
    expect(listRes.body.data).to.have.lengthOf(1);
    expect(listRes.body.meta.total).to.equal(1);

    const summaryRes = await request(app)
      .get('/api/patrimonies/summary')
      .set('Authorization', authHeader);

    expect(summaryRes.status).to.equal(200);
    expect(summaryRes.body.data.totals.items).to.equal(1);
    expect(summaryRes.body.data.totals.totalValue).to.equal(29001);

    const updateRes = await request(app)
      .patch(`/api/patrimonies/${patrimonyId}`)
      .set('Authorization', authHeader)
      .send({ condition: 'Excelente', location: 'Matriz - Diretoria' });

    expect(updateRes.status).to.equal(200);
    expect(updateRes.body.data.condition).to.equal('Excelente');
    expect(updateRes.body.data.location).to.equal('Matriz - Diretoria');

    const qrRes = await request(app)
      .get(`/api/patrimonies/${patrimonyId}/qrcode`)
      .set('Authorization', authHeader);

    expect(qrRes.status).to.equal(200);
    expect(qrRes.body.data.qrCodeDataUrl).to.match(/^data:image\/png;base64,/);
    expect(qrRes.body.data.verificationUrl).to.include(createRes.body.data.serialNumber);

    const movementRes = await request(app)
      .post(`/api/patrimonies/${patrimonyId}/movements`)
      .set('Authorization', authHeader)
      .send({
        type: 'Manutenção',
        description: 'Upgrade de memória e revisão preventiva',
        responsible: 'Suporte TI'
      });

    expect(movementRes.status).to.equal(201);
    expect(movementRes.body.data.responsible).to.equal('Suporte TI');
    expect(movementRes.body.data.movements).to.be.an('array').with.length.greaterThan(1);

    const publicVerifyRes = await request(app).get(
      `/api/public/patrimonies/${createRes.body.data.serialNumber}`
    );

    expect(publicVerifyRes.status).to.equal(200);
    expect(publicVerifyRes.body.data.patrimony.serialNumber).to.equal(
      createRes.body.data.serialNumber
    );
    expect(publicVerifyRes.body.data.company.cnpj).to.equal('11222333000181');
    expect(publicVerifyRes.body.data.qrCodeDataUrl).to.match(/^data:image\/png;base64,/);

    const maintCreateRes = await request(app)
      .post('/api/maintenances')
      .set('Authorization', authHeader)
      .send({
        patrimonyId,
        type: 'Preventiva',
        title: 'Limpeza térmica e atualização de firmware',
        description: 'Manutenção semestral agendada',
        provider: 'Assistência Autorizada Apple',
        cost: 420.5,
        scheduledDate: '2026-11-15',
        status: 'Aberta'
      });

    expect(maintCreateRes.status).to.equal(201);
    expect(maintCreateRes.body.data.id).to.match(/^[a-f0-9]{24}$/i);
    expect(maintCreateRes.body.data.serialNumber).to.equal(createRes.body.data.serialNumber);

    const maintId = maintCreateRes.body.data.id;

    const maintUpdateRes = await request(app)
      .patch(`/api/maintenances/${maintId}`)
      .set('Authorization', authHeader)
      .send({ status: 'Concluída' });

    expect(maintUpdateRes.status).to.equal(200);
    expect(maintUpdateRes.body.data.status).to.equal('Concluída');
    expect(maintUpdateRes.body.data.completedAt).to.be.a('string');

    const maintListRes = await request(app)
      .get('/api/maintenances')
      .set('Authorization', authHeader);

    expect(maintListRes.status).to.equal(200);
    expect(maintListRes.body.data).to.have.lengthOf(1);
    expect(maintListRes.body.meta.completed).to.equal(1);
    expect(maintListRes.body.meta.totalCost).to.equal(420.5);

    const loanCreateRes = await request(app)
      .post('/api/loans')
      .set('Authorization', authHeader)
      .send({
        patrimonyId,
        borrowerName: 'Ana Paula Souza',
        borrowerDocument: '123.456.789-00',
        department: 'Comercial',
        purpose: 'Reunião estratégica com cliente',
        loanDate: '2026-10-28',
        expectedReturnDate: '2026-11-04',
        conditionOut: 'Excelente'
      });

    expect(loanCreateRes.status).to.equal(201);
    expect(loanCreateRes.body.data.id).to.match(/^[a-f0-9]{24}$/i);
    expect(loanCreateRes.body.data.status).to.equal('Em andamento');

    const loanId = loanCreateRes.body.data.id;

    const loanCheckinRes = await request(app)
      .patch(`/api/loans/${loanId}`)
      .set('Authorization', authHeader)
      .send({ status: 'Devolvido', conditionIn: 'Excelente' });

    expect(loanCheckinRes.status).to.equal(200);
    expect(loanCheckinRes.body.data.status).to.equal('Devolvido');
    expect(loanCheckinRes.body.data.returnedAt).to.be.a('string');

    const loanListRes = await request(app)
      .get('/api/loans')
      .set('Authorization', authHeader);

    expect(loanListRes.status).to.equal(200);
    expect(loanListRes.body.data).to.have.lengthOf(1);
    expect(loanListRes.body.meta.returned).to.equal(1);

    const insCreateRes = await request(app)
      .post('/api/insurances')
      .set('Authorization', authHeader)
      .send({
        patrimonyId,
        policyNumber: 'APO-TEST-2026-01',
        insurer: 'Porto Seguro',
        coverageType: 'Roubo e Furto Qualificado',
        insuredAmount: 14500.5,
        premiumCost: 650,
        deductible: 1200,
        startDate: '2026-10-01',
        endDate: '2027-10-01'
      });

    expect(insCreateRes.status).to.equal(201);
    expect(insCreateRes.body.data.id).to.match(/^[a-f0-9]{24}$/i);
    expect(insCreateRes.body.data.status).to.equal('Vigente');

    const insListRes = await request(app)
      .get('/api/insurances')
      .set('Authorization', authHeader);

    expect(insListRes.status).to.equal(200);
    expect(insListRes.body.data).to.have.lengthOf(1);
    expect(insListRes.body.meta.totalInsuredAmount).to.equal(14500.5);

    const adminOverviewRes = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', authHeader);

    expect(adminOverviewRes.status).to.equal(200);
    expect(adminOverviewRes.body.data.summary.totalUsers).to.equal(1);
    expect(adminOverviewRes.body.data.summary.totalPatrimonies).to.equal(1);

    const adminPatsRes = await request(app)
      .get('/api/admin/patrimonies')
      .set('Authorization', authHeader);

    expect(adminPatsRes.status).to.equal(200);
    expect(adminPatsRes.body.data).to.have.lengthOf(1);
    expect(adminPatsRes.body.data[0].owner.cnpj).to.equal('11222333000181');

    const deleteRes = await request(app)
      .delete(`/api/patrimonies/${patrimonyId}`)
      .set('Authorization', authHeader);

    expect(deleteRes.status).to.equal(204);

    const getDeletedRes = await request(app)
      .get(`/api/patrimonies/${patrimonyId}`)
      .set('Authorization', authHeader);

    expect(getDeletedRes.status).to.equal(404);
  });
});
