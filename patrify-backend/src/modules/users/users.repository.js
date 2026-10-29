const { getCollection, toObjectId } = require('../../config/database');
const { toUserDto } = require('../auth/auth.repository');

const findById = async (id) => {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const users = await getCollection('users');
  return users.findOne({ _id: objectId });
};

const updateProfile = async (id, data) => {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const updates = { updatedAt: new Date() };
  if (data.name !== undefined && data.name !== null) updates.name = data.name;
  if (data.email !== undefined && data.email !== null) {
    updates.email = String(data.email).trim().toLowerCase();
  }
  if (data.phone1 !== undefined) updates.phone1 = data.phone1 || null;
  if (data.phone2 !== undefined) updates.phone2 = data.phone2 || null;
  if (data.branchType !== undefined) updates.branchType = data.branchType || null;
  if (data.companySize !== undefined) updates.companySize = data.companySize || null;

  const users = await getCollection('users');
  return users.findOneAndUpdate(
    { _id: objectId },
    { $set: updates },
    { returnDocument: 'after' }
  );
};

module.exports = { findById, updateProfile, toUserDto };
