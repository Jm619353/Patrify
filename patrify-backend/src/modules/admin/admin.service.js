const crypto = require('crypto');
const { getCollection, toObjectId } = require('../../config/database');
const ApiError = require('../../shared/errors/ApiError');
const { hashPassword } = require('../../shared/utils/password');
const { signAccessToken } = require('../../shared/tokens');
const { generateUniqueSerial } = require('../../shared/utils/serial');
const { toUserDto } = require('../auth/auth.repository');
const patrimonyRepository = require('../patrimony/patrimony.repository');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOverview = async (search = '') => {
  const [usersCol, patrimoniesCol, maintenancesCol, loansCol, insurancesCol] = await Promise.all([
    getCollection('users'),
    getCollection('patrimonies'),
    getCollection('maintenances'),
    getCollection('loans'),
    getCollection('insurances')
  ]);

  const userQuery = {};
  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    userQuery.$or = [
      { name: regex },
      { legalName: regex },
      { cnpj: regex },
      { email: regex },
      { economicActivity: regex }
    ];
  }

  const [
    allUsers,
    filteredUsers,
    allPatrimonies,
    totalMaintenances,
    totalLoans,
    totalInsurances
  ] = await Promise.all([
    usersCol.find({}).sort({ createdAt: -1 }).toArray(),
    usersCol.find(userQuery).sort({ createdAt: -1 }).toArray(),
    patrimoniesCol.find({ deletedAt: null }).toArray(),
    maintenancesCol.countDocuments({}),
    loansCol.countDocuments({}),
    insurancesCol.countDocuments({})
  ]);

  const statsByUser = new Map();
  let totalAssetValue = 0;
  let totalUnits = 0;

  allPatrimonies.forEach((pat) => {
    const uid = String(pat.userId);
    const current = statsByUser.get(uid) || {
      patrimonyCount: 0,
      totalUnits: 0,
      totalValue: 0,
      activeCount: 0
    };
    const qty = Number(pat.quantity) || 1;
    const itemTotal = toNumber(pat.value) * qty;

    current.patrimonyCount += 1;
    current.totalUnits += qty;
    current.totalValue = Number((current.totalValue + itemTotal).toFixed(2));
    if (pat.status === 'Ativo') current.activeCount += 1;

    statsByUser.set(uid, current);

    totalUnits += qty;
    totalAssetValue += itemTotal;
  });

  const activeUsers = allUsers.filter((u) => u.active !== false).length;
  const suspendedUsers = allUsers.length - activeUsers;

  const enrichedUsers = filteredUsers.map((doc) => {
    const dto = toUserDto(doc);
    const stats = statsByUser.get(dto.id) || {
      patrimonyCount: 0,
      totalUnits: 0,
      totalValue: 0,
      activeCount: 0
    };
    return {
      ...dto,
      metrics: stats
    };
  });

  return {
    summary: {
      totalUsers: allUsers.length,
      activeUsers,
      suspendedUsers,
      totalPatrimonies: allPatrimonies.length,
      totalUnits,
      totalAssetValue: Number(totalAssetValue.toFixed(2)),
      totalMaintenances,
      totalLoans,
      totalInsurances
    },
    users: enrichedUsers
  };
};

const createUser = async (payload) => {
  const usersCol = await getCollection('users');

  const existingCnpj = await usersCol.findOne({ cnpj: payload.cnpj });
  if (existingCnpj) {
    throw ApiError.conflict('Já existe uma empresa cadastrada com este CNPJ.', {
      code: 'CNPJ_ALREADY_REGISTERED'
    });
  }

  const normalizedEmail = String(payload.email).trim().toLowerCase();
  const existingEmail = await usersCol.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw ApiError.conflict('Já existe um usuário cadastrado com este e-mail.', {
      code: 'EMAIL_ALREADY_REGISTERED'
    });
  }

  const now = new Date();
  const passwordHash = await hashPassword(payload.password);

  const doc = {
    name: payload.name,
    legalName: payload.legalName || payload.name,
    cnpj: payload.cnpj,
    email: normalizedEmail,
    passwordHash,
    phone1: payload.phone1 || null,
    phone2: payload.phone2 || null,
    address: payload.address || null,
    economicActivity: payload.economicActivity || null,
    branchType: payload.branchType || 'Matriz',
    companySize: payload.companySize || 'Médio porte',
    role: payload.role || 'company',
    plan: payload.plan || 'basic',
    active: payload.active !== false,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    passwordChangedAt: null
  };

  const result = await usersCol.insertOne(doc);
  return {
    ...toUserDto({ ...doc, _id: result.insertedId }),
    metrics: { patrimonyCount: 0, totalUnits: 0, totalValue: 0, activeCount: 0 }
  };
};

const updateUser = async (id, payload) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  const usersCol = await getCollection('users');
  const existing = await usersCol.findOne({ _id: objectId });
  if (!existing) {
    throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  const now = new Date();
  const updates = { updatedAt: now };

  if (payload.cnpj && payload.cnpj !== existing.cnpj) {
    const dupCnpj = await usersCol.findOne({ cnpj: payload.cnpj, _id: { $ne: objectId } });
    if (dupCnpj) {
      throw ApiError.conflict('Este CNPJ já está vinculado a outra empresa.', {
        code: 'CNPJ_ALREADY_REGISTERED'
      });
    }
    updates.cnpj = payload.cnpj;
  }

  if (payload.email) {
    const normalizedEmail = String(payload.email).trim().toLowerCase();
    if (normalizedEmail !== existing.email) {
      const dupEmail = await usersCol.findOne({ email: normalizedEmail, _id: { $ne: objectId } });
      if (dupEmail) {
        throw ApiError.conflict('Este e-mail já está em uso por outra empresa.', {
          code: 'EMAIL_ALREADY_REGISTERED'
        });
      }
      updates.email = normalizedEmail;
    }
  }

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.legalName !== undefined) updates.legalName = payload.legalName || null;
  if (payload.phone1 !== undefined) updates.phone1 = payload.phone1 || null;
  if (payload.phone2 !== undefined) updates.phone2 = payload.phone2 || null;
  if (payload.address !== undefined) updates.address = payload.address || null;
  if (payload.economicActivity !== undefined) {
    updates.economicActivity = payload.economicActivity || null;
  }
  if (payload.branchType !== undefined) updates.branchType = payload.branchType || null;
  if (payload.companySize !== undefined) updates.companySize = payload.companySize || null;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.plan !== undefined) updates.plan = payload.plan;
  if (payload.active !== undefined) updates.active = payload.active;

  if (payload.password) {
    updates.passwordHash = await hashPassword(payload.password);
    updates.passwordChangedAt = now;
  }

  const updated = await usersCol.findOneAndUpdate(
    { _id: objectId },
    { $set: updates },
    { returnDocument: 'after' }
  );

  return toUserDto(updated);
};

const deleteUser = async (id, currentAdminId) => {
  if (String(id) === String(currentAdminId)) {
    throw ApiError.badRequest(
      'Você não pode excluir a sua própria conta de administrador em uso.',
      { code: 'CANNOT_DELETE_SELF' }
    );
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  const [usersCol, patrimoniesCol, maintenancesCol, loansCol, insurancesCol] = await Promise.all([
    getCollection('users'),
    getCollection('patrimonies'),
    getCollection('maintenances'),
    getCollection('loans'),
    getCollection('insurances')
  ]);

  const result = await usersCol.deleteOne({ _id: objectId });
  if (result.deletedCount === 0) {
    throw ApiError.notFound('Usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  await Promise.all([
    patrimoniesCol.deleteMany({ userId: objectId }),
    maintenancesCol.deleteMany({ userId: objectId }),
    loansCol.deleteMany({ userId: objectId }),
    insurancesCol.deleteMany({ userId: objectId })
  ]);
};

const impersonateUser = async (id) => {
  const objectId = toObjectId(id);
  if (!objectId) {
    throw ApiError.notFound('Empresa/usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  const usersCol = await getCollection('users');
  const user = await usersCol.findOne({ _id: objectId });
  if (!user) {
    throw ApiError.notFound('Empresa/usuário não encontrado.', { code: 'USER_NOT_FOUND' });
  }

  const dto = toUserDto(user);
  const token = signAccessToken(dto);
  return { user: dto, token };
};

const listAllPatrimonies = async (filters = {}) => {
  const [usersCol, patrimoniesCol] = await Promise.all([
    getCollection('users'),
    getCollection('patrimonies')
  ]);

  const query = { deletedAt: null };
  if (filters.userId) {
    const uid = toObjectId(filters.userId);
    if (uid) query.userId = uid;
  }
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [
      { name: regex },
      { serialNumber: regex },
      { location: regex },
      { responsible: regex },
      { invoiceNumber: regex }
    ];
  }

  const [patrimonyDocs, userDocs] = await Promise.all([
    patrimoniesCol.find(query).sort({ createdAt: -1 }).toArray(),
    usersCol.find({}).toArray()
  ]);

  const userMap = new Map();
  userDocs.forEach((u) => {
    userMap.set(String(u._id), {
      id: String(u._id),
      name: u.name,
      legalName: u.legalName || u.name,
      cnpj: u.cnpj,
      email: u.email
    });
  });

  return patrimonyDocs.map((doc) => {
    const mapped = patrimonyRepository.mapRow(doc);
    const owner = userMap.get(String(doc.userId)) || {
      id: String(doc.userId),
      name: 'Empresa Removida',
      legalName: null,
      cnpj: '00000000000000',
      email: ''
    };
    return {
      ...mapped,
      owner
    };
  });
};

const createPatrimonyForUser = async (payload) => {
  const usersCol = await getCollection('users');
  const ownerObjectId = toObjectId(payload.userId);
  const ownerDoc = ownerObjectId ? await usersCol.findOne({ _id: ownerObjectId }) : null;

  if (!ownerDoc) {
    throw ApiError.notFound('Empresa proprietária não encontrada.', {
      code: 'OWNER_NOT_FOUND'
    });
  }

  const serialNumber = await generateUniqueSerial(
    payload.category,
    patrimonyRepository.serialExists
  );

  const created = await patrimonyRepository.create(payload.userId, {
    ...payload,
    serialNumber
  });

  return {
    ...created,
    owner: {
      id: String(ownerDoc._id),
      name: ownerDoc.name,
      legalName: ownerDoc.legalName || ownerDoc.name,
      cnpj: ownerDoc.cnpj,
      email: ownerDoc.email
    }
  };
};

const updateAnyPatrimony = async (id, payload) => {
  const itemObjectId = toObjectId(id);
  if (!itemObjectId) {
    throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  }

  const [usersCol, patrimoniesCol] = await Promise.all([
    getCollection('users'),
    getCollection('patrimonies')
  ]);

  const existing = await patrimoniesCol.findOne({ _id: itemObjectId, deletedAt: null });
  if (!existing) {
    throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  }

  const now = new Date();
  const updates = { updatedAt: now };

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.value !== undefined) updates.value = toNumber(payload.value);
  if (payload.quantity !== undefined) updates.quantity = Number(payload.quantity);
  if (payload.purchaseDate !== undefined) updates.purchaseDate = payload.purchaseDate;
  if (payload.location !== undefined) updates.location = payload.location;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.condition !== undefined) updates.condition = payload.condition;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.responsible !== undefined) updates.responsible = payload.responsible || null;
  if (payload.invoiceNumber !== undefined) updates.invoiceNumber = payload.invoiceNumber || null;
  if (payload.warrantyUntil !== undefined) updates.warrantyUntil = payload.warrantyUntil || null;
  if (payload.notes !== undefined) updates.notes = payload.notes || null;

  const updateOps = { $set: updates };

  if (payload.userId && String(payload.userId) !== String(existing.userId)) {
    const newOwnerId = toObjectId(payload.userId);
    const newOwner = newOwnerId ? await usersCol.findOne({ _id: newOwnerId }) : null;
    if (!newOwner) {
      throw ApiError.notFound('Nova empresa proprietária não encontrada.', {
        code: 'OWNER_NOT_FOUND'
      });
    }
    updates.userId = newOwnerId;
    updateOps.$push = {
      movements: {
        id: crypto.randomUUID(),
        type: 'Transferência',
        description: `Titularidade transferida pelo Administrador do Sistema para a empresa ${newOwner.name} (CNPJ ${newOwner.cnpj}).`,
        location: updates.location || existing.location,
        responsible: updates.responsible ?? existing.responsible ?? null,
        status: updates.status || existing.status,
        condition: updates.condition || existing.condition,
        createdAt: now
      }
    };
  } else {
    updateOps.$push = {
      movements: {
        id: crypto.randomUUID(),
        type: 'Auditoria',
        description: 'Registro atualizado pela Administração Global do Sistema.',
        location: updates.location || existing.location,
        responsible: updates.responsible ?? existing.responsible ?? null,
        status: updates.status || existing.status,
        condition: updates.condition || existing.condition,
        createdAt: now
      }
    };
  }

  const updatedDoc = await patrimoniesCol.findOneAndUpdate(
    { _id: itemObjectId },
    updateOps,
    { returnDocument: 'after' }
  );

  const ownerDoc = await usersCol.findOne({ _id: updatedDoc.userId });
  return {
    ...patrimonyRepository.mapRow(updatedDoc),
    owner: ownerDoc
      ? {
          id: String(ownerDoc._id),
          name: ownerDoc.name,
          legalName: ownerDoc.legalName || ownerDoc.name,
          cnpj: ownerDoc.cnpj,
          email: ownerDoc.email
        }
      : null
  };
};

const deleteAnyPatrimony = async (id) => {
  const itemObjectId = toObjectId(id);
  if (!itemObjectId) {
    throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  }

  const patrimoniesCol = await getCollection('patrimonies');
  const result = await patrimoniesCol.updateOne(
    { _id: itemObjectId, deletedAt: null },
    { $set: { deletedAt: new Date(), updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    throw ApiError.notFound('Patrimônio não encontrado.', { code: 'PATRIMONY_NOT_FOUND' });
  }
};

module.exports = {
  getOverview,
  createUser,
  updateUser,
  deleteUser,
  impersonateUser,
  listAllPatrimonies,
  createPatrimonyForUser,
  updateAnyPatrimony,
  deleteAnyPatrimony
};
