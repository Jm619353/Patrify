const { getCollection, toObjectId } = require('../../config/database');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRow = (doc) => {
  if (!doc) return null;
  return {
    id: String(doc._id),
    patrimonyId: String(doc.patrimonyId),
    patrimonyName: doc.patrimonyName,
    serialNumber: doc.serialNumber,
    category: doc.category,
    policyNumber: doc.policyNumber,
    insurer: doc.insurer,
    coverageType: doc.coverageType,
    insuredAmount: toNumber(doc.insuredAmount),
    premiumCost: toNumber(doc.premiumCost),
    deductible: toNumber(doc.deductible),
    startDate: doc.startDate,
    endDate: doc.endDate,
    status: doc.status,
    brokerContact: doc.brokerContact ?? null,
    claimNotes: doc.claimNotes ?? null,
    claimedAt: doc.claimedAt ?? null,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const list = async (userId, filters = {}) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return {
      items: [],
      summary: {
        total: 0,
        active: 0,
        expiringSoon: 0,
        claimed: 0,
        totalInsuredAmount: 0,
        totalPremiumCost: 0
      }
    };
  }

  const insurances = await getCollection('insurances');
  const query = { userId: userObjectId };

  if (filters.status) query.status = filters.status;
  if (filters.coverageType) query.coverageType = filters.coverageType;
  if (filters.patrimonyId) {
    const patId = toObjectId(filters.patrimonyId);
    if (patId) query.patrimonyId = patId;
  }
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [
      { policyNumber: regex },
      { insurer: regex },
      { patrimonyName: regex },
      { serialNumber: regex },
      { brokerContact: regex }
    ];
  }

  const [docs, allUserDocs] = await Promise.all([
    insurances.find(query).sort({ endDate: 1, createdAt: -1 }).toArray(),
    insurances.find({ userId: userObjectId }).toArray()
  ]);

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let active = 0;
  let expiringSoon = 0;
  let claimed = 0;
  let totalInsuredAmount = 0;
  let totalPremiumCost = 0;

  allUserDocs.forEach((doc) => {
    if (doc.status === 'Vigente') {
      active += 1;
      totalInsuredAmount += toNumber(doc.insuredAmount);
      if (doc.endDate && doc.endDate >= todayIso && doc.endDate <= in30Days) {
        expiringSoon += 1;
      }
    } else if (doc.status === 'Sinistro Acionado') {
      claimed += 1;
      totalInsuredAmount += toNumber(doc.insuredAmount);
    }

    if (doc.status !== 'Cancelada') {
      totalPremiumCost += toNumber(doc.premiumCost);
    }
  });

  return {
    items: docs.map(mapRow),
    summary: {
      total: allUserDocs.length,
      active,
      expiringSoon,
      claimed,
      totalInsuredAmount: Number(totalInsuredAmount.toFixed(2)),
      totalPremiumCost: Number(totalPremiumCost.toFixed(2))
    }
  };
};

const findById = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const insurances = await getCollection('insurances');
  const doc = await insurances.findOne({ _id: itemObjectId, userId: userObjectId });
  return mapRow(doc);
};

const create = async (userId, patrimony, data) => {
  const userObjectId = toObjectId(userId);
  const patrimonyObjectId = toObjectId(patrimony.id);
  const insurances = await getCollection('insurances');
  const now = new Date();

  const doc = {
    userId: userObjectId,
    patrimonyId: patrimonyObjectId,
    patrimonyName: patrimony.name,
    serialNumber: patrimony.serialNumber,
    category: patrimony.category,
    policyNumber: data.policyNumber,
    insurer: data.insurer,
    coverageType: data.coverageType,
    insuredAmount: toNumber(data.insuredAmount),
    premiumCost: toNumber(data.premiumCost),
    deductible: toNumber(data.deductible),
    startDate: data.startDate,
    endDate: data.endDate,
    status: 'Vigente',
    brokerContact: data.brokerContact || null,
    claimNotes: null,
    claimedAt: null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now
  };

  const result = await insurances.insertOne(doc);
  return mapRow({ ...doc, _id: result.insertedId });
};

const update = async (userId, id, data) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const insurances = await getCollection('insurances');
  const existing = await insurances.findOne({ _id: itemObjectId, userId: userObjectId });
  if (!existing) return null;

  const now = new Date();
  const updates = { updatedAt: now };

  if (data.endDate !== undefined) updates.endDate = data.endDate;
  if (data.claimNotes !== undefined) updates.claimNotes = data.claimNotes || null;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'Sinistro Acionado' && !existing.claimedAt) {
      updates.claimedAt = now;
    }
  }

  const updated = await insurances.findOneAndUpdate(
    { _id: itemObjectId, userId: userObjectId },
    { $set: updates },
    { returnDocument: 'after' }
  );

  return mapRow(updated);
};

const remove = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return false;

  const insurances = await getCollection('insurances');
  const result = await insurances.deleteOne({ _id: itemObjectId, userId: userObjectId });
  return result.deletedCount > 0;
};

module.exports = {
  mapRow,
  list,
  findById,
  create,
  update,
  remove
};
