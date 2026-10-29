const QRCode = require('qrcode');
const env = require('../../config/env');
const ApiError = require('../../shared/errors/ApiError');
const { generateUniqueSerialNumber } = require('../../shared/utils/serial');
const { parsePagination, buildMeta } = require('../../shared/utils/pagination');
const { getCollection, toObjectId } = require('../../config/database');
const repository = require('./patrimony.repository');
const storage = require('./storage.service');

const PLAN_PATRIMONY_LIMITS = {
  basic: 50,
  pro: 500,
  enterprise: Infinity
};

const buildVerificationUrl = (serialNumber, baseFrontendUrl) => {
  const base = (baseFrontendUrl || env.FRONTEND_URL || 'http://localhost:4300').replace(/\/+$/, '');
  return `${base}/verificar/${encodeURIComponent(serialNumber)}`;
};

const generateQrDataUrl = async (text) =>
  QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

const list = async (userId, filters) => {
  const pagination = parsePagination(filters);
  const { items, total } = await repository.list(userId, {
    ...filters,
    limit: pagination.limit,
    offset: pagination.offset
  });
  return {
    items,
    meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total })
  };
};

const getById = async (userId, id) => {
  const item = await repository.findById(userId, id);
  if (!item) throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  return item;
};

const getPublicBySerial = async (serial, frontendOrigin) => {
  const found = await repository.findBySerialPublic(serial);
  if (!found) {
    throw ApiError.notFound('Nenhum patrimônio encontrado para este código de série.', {
      code: 'PATRIMONY_NOT_FOUND'
    });
  }

  const verificationUrl = buildVerificationUrl(found.patrimony.serialNumber, frontendOrigin);
  const qrCodeDataUrl = await generateQrDataUrl(verificationUrl);

  return {
    ...found,
    verificationUrl,
    qrCodeDataUrl,
    verifiedAt: new Date().toISOString()
  };
};

const getQrCode = async (userId, id, frontendOrigin) => {
  const item = await getById(userId, id);
  const verificationUrl = buildVerificationUrl(item.serialNumber, frontendOrigin);
  const qrCodeDataUrl = await generateQrDataUrl(verificationUrl);

  return {
    patrimonyId: item.id,
    serialNumber: item.serialNumber,
    name: item.name,
    category: item.category,
    location: item.location,
    verificationUrl,
    qrCodeDataUrl
  };
};

const create = async (userId, payload) => {
  const userObjectId = toObjectId(userId);
  if (userObjectId) {
    const [usersCol, patrimoniesCol] = await Promise.all([
      getCollection('users'),
      getCollection('patrimonies')
    ]);
    const userDoc = await usersCol.findOne({ _id: userObjectId });
    if (userDoc && userDoc.role !== 'admin') {
      const plan = userDoc.plan || 'basic';
      const limit = PLAN_PATRIMONY_LIMITS[plan] ?? 50;
      if (Number.isFinite(limit)) {
        const currentCount = await patrimoniesCol.countDocuments({
          userId: userObjectId,
          deletedAt: null
        });
        if (currentCount >= limit) {
          throw ApiError.forbidden(
            `Limite de ${limit} patrimônios do seu plano (${plan.toUpperCase()}) atingido. Solicite upgrade ao Administrador do Sistema.`,
            { code: 'PLAN_LIMIT_REACHED' }
          );
        }
      }
    }
  }

  const serialNumber = await generateUniqueSerialNumber(payload.category, repository.serialExists);
  return repository.create(userId, { ...payload, serialNumber });
};

const update = async (userId, id, payload) => {
  const updated = await repository.update(userId, id, payload);
  if (!updated) throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  return updated;
};

const addMovement = async (userId, id, payload) => {
  const updated = await repository.addMovement(userId, id, payload);
  if (!updated) throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  return updated;
};

const remove = async (userId, id) => {
  const deleted = await repository.softDelete(userId, id);
  if (!deleted) throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
};

const uploadImage = async (userId, id, file) => {
  const patrimony = await getById(userId, id);
  const imageUrl = await storage.storeImage({ file, userId, patrimonyId: id });
  await repository.setImage(userId, id, imageUrl);
  await storage.removeLocalImage(patrimony.imageUrl);
  return getById(userId, id);
};

const getSummary = (userId) => repository.getSummary(userId);

module.exports = {
  list,
  getById,
  getPublicBySerial,
  getQrCode,
  create,
  update,
  addMovement,
  remove,
  uploadImage,
  getSummary
};
