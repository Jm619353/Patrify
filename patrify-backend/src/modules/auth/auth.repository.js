const { getCollection, toObjectId } = require('../../config/database');

const toUserDto = (doc) => {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    cnpj: doc.cnpj,
    legalName: doc.legalName ?? null,
    phone1: doc.phone1 ?? null,
    phone2: doc.phone2 ?? null,
    address: doc.address ?? null,
    economicActivity: doc.economicActivity ?? null,
    branchType: doc.branchType ?? null,
    companySize: doc.companySize ?? null,
    role: doc.role ?? 'admin',
    plan: doc.plan ?? 'enterprise',
    active: doc.active !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastLoginAt: doc.lastLoginAt ?? null
  };
};

const findByCnpj = async (cnpj) => {
  const users = await getCollection('users');
  return users.findOne({ cnpj });
};

const findByEmail = async (email) => {
  const users = await getCollection('users');
  return users.findOne({ email: String(email).trim().toLowerCase() });
};

const findById = async (id) => {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const users = await getCollection('users');
  return users.findOne({ _id: objectId });
};

const createUser = async (data) => {
  const users = await getCollection('users');
  const now = new Date();
  const doc = {
    name: data.name,
    phone1: data.phone1 || null,
    phone2: data.phone2 || null,
    email: String(data.email).trim().toLowerCase(),
    cnpj: data.cnpj,
    legalName: data.legalName || null,
    address: data.address || null,
    economicActivity: data.economicActivity || null,
    branchType: null,
    companySize: null,
    passwordHash: data.passwordHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    passwordChangedAt: null
  };

  const result = await users.insertOne(doc);
  return { ...doc, _id: result.insertedId };
};

const updateLastLogin = async (id) => {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const users = await getCollection('users');
  const now = new Date();
  return users.findOneAndUpdate(
    { _id: objectId },
    { $set: { lastLoginAt: now, updatedAt: now } },
    { returnDocument: 'after' }
  );
};

const updatePassword = async (id, passwordHash) => {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const users = await getCollection('users');
  const now = new Date();
  return users.updateOne(
    { _id: objectId },
    { $set: { passwordHash, passwordChangedAt: now, updatedAt: now } }
  );
};

const getPasswordChangedAt = async (id) => {
  const user = await findById(id);
  return user?.passwordChangedAt || null;
};

module.exports = {
  toUserDto,
  findByCnpj,
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  updatePassword,
  getPasswordChangedAt
};
