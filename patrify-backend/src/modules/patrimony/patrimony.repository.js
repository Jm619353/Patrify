const crypto = require('crypto');
const { getCollection, toObjectId } = require('../../config/database');
const { calculateDepreciation } = require('../../shared/utils/depreciation');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRow = (doc) => {
  if (!doc) return null;
  const movements = Array.isArray(doc.movements)
    ? [...doc.movements].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  return {
    id: String(doc._id),
    name: doc.name,
    value: toNumber(doc.value),
    purchaseDate: doc.purchaseDate,
    location: doc.location ?? null,
    status: doc.status,
    condition: doc.condition,
    category: doc.category,
    serialNumber: doc.serialNumber,
    quantity: doc.quantity || 1,
    imageUrl: doc.imageUrl ?? null,
    responsible: doc.responsible ?? null,
    invoiceNumber: doc.invoiceNumber ?? null,
    warrantyUntil: doc.warrantyUntil ?? null,
    notes: doc.notes ?? null,
    depreciation: calculateDepreciation(doc),
    movements,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const SORT_COLUMNS = {
  name: 'name',
  value: 'value',
  purchaseDate: 'purchaseDate',
  createdAt: 'createdAt',
  category: 'category',
  status: 'status',
  condition: 'condition'
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilters = (userId, filters) => {
  const query = {
    userId: toObjectId(userId),
    deletedAt: null
  };

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
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.condition) query.condition = filters.condition;

  if (filters.minValue !== undefined || filters.maxValue !== undefined) {
    query.value = {};
    if (filters.minValue !== undefined) query.value.$gte = filters.minValue;
    if (filters.maxValue !== undefined) query.value.$lte = filters.maxValue;
  }

  if (filters.from || filters.to) {
    query.purchaseDate = {};
    if (filters.from) query.purchaseDate.$gte = filters.from;
    if (filters.to) query.purchaseDate.$lte = filters.to;
  }

  return query;
};

const list = async (userId, filters) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return { items: [], total: 0 };

  const patrimonies = await getCollection('patrimonies');
  const query = buildFilters(userObjectId, filters);
  const sortField = SORT_COLUMNS[filters.sort] || SORT_COLUMNS.createdAt;
  const order = filters.order === 'asc' ? 1 : -1;

  const [docs, total] = await Promise.all([
    patrimonies
      .find(query)
      .sort({ [sortField]: order, _id: -1 })
      .skip(filters.offset)
      .limit(filters.limit)
      .toArray(),
    patrimonies.countDocuments(query)
  ]);

  return {
    items: docs.map(mapRow),
    total
  };
};

const findById = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const patrimonies = await getCollection('patrimonies');
  const doc = await patrimonies.findOne({
    _id: itemObjectId,
    userId: userObjectId,
    deletedAt: null
  });
  return mapRow(doc);
};

const findBySerialPublic = async (serialOrId) => {
  const cleaned = String(serialOrId || '').trim();
  if (!cleaned) return null;

  const patrimonies = await getCollection('patrimonies');
  const users = await getCollection('users');

  const itemObjectId = toObjectId(cleaned);
  const query = itemObjectId
    ? { $or: [{ _id: itemObjectId }, { serialNumber: cleaned.toUpperCase() }], deletedAt: null }
    : { serialNumber: new RegExp(`^${escapeRegex(cleaned)}$`, 'i'), deletedAt: null };

  const doc = await patrimonies.findOne(query);
  if (!doc) return null;

  const owner = await users.findOne({ _id: doc.userId });
  return {
    patrimony: mapRow(doc),
    company: owner
      ? {
          name: owner.name,
          legalName: owner.legalName ?? null,
          cnpj: owner.cnpj,
          email: owner.email ?? null,
          phone1: owner.phone1 ?? null,
          address: owner.address ?? null,
          branchType: owner.branchType ?? null
        }
      : null
  };
};

const serialExists = async (serial) => {
  const patrimonies = await getCollection('patrimonies');
  const doc = await patrimonies.findOne({ serialNumber: serial }, { projection: { _id: 1 } });
  return Boolean(doc);
};

const create = async (userId, data) => {
  const userObjectId = toObjectId(userId);
  const patrimonies = await getCollection('patrimonies');
  const now = new Date();

  const initialMovement = {
    id: crypto.randomUUID(),
    type: 'Cadastro',
    description: 'Patrimônio registrado no inventário.',
    location: data.location || null,
    responsible: data.responsible || null,
    status: data.status,
    condition: data.condition,
    createdAt: now
  };

  const doc = {
    userId: userObjectId,
    name: data.name,
    value: toNumber(data.value),
    purchaseDate: data.purchaseDate,
    location: data.location || null,
    status: data.status,
    condition: data.condition,
    category: data.category,
    serialNumber: data.serialNumber,
    quantity: data.quantity || 1,
    responsible: data.responsible || null,
    invoiceNumber: data.invoiceNumber || null,
    warrantyUntil: data.warrantyUntil || null,
    notes: data.notes || null,
    movements: [initialMovement],
    imageUrl: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  };

  const result = await patrimonies.insertOne(doc);
  return mapRow({ ...doc, _id: result.insertedId });
};

const ALLOWED_FIELDS = [
  'name',
  'value',
  'purchaseDate',
  'location',
  'status',
  'condition',
  'category',
  'quantity',
  'responsible',
  'invoiceNumber',
  'warrantyUntil',
  'notes'
];

const NULLABLE_TEXT_FIELDS = ['location', 'responsible', 'invoiceNumber', 'warrantyUntil', 'notes'];

const update = async (userId, id, data) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const patrimonies = await getCollection('patrimonies');
  const existing = await patrimonies.findOne({
    _id: itemObjectId,
    userId: userObjectId,
    deletedAt: null
  });
  if (!existing) return null;

  const updates = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (data[field] !== undefined) {
      if (field === 'value') {
        updates.value = toNumber(data.value);
      } else if (NULLABLE_TEXT_FIELDS.includes(field)) {
        updates[field] = data[field] || null;
      } else {
        updates[field] = data[field];
      }
    }
  });

  if (Object.keys(updates).length === 0) return mapRow(existing);

  const now = new Date();
  updates.updatedAt = now;

  const changes = [];
  if (updates.location !== undefined && updates.location !== (existing.location ?? null)) {
    changes.push(`Localização: ${existing.location || '—'} → ${updates.location || '—'}`);
  }
  if (updates.status !== undefined && updates.status !== existing.status) {
    changes.push(`Status: ${existing.status} → ${updates.status}`);
  }
  if (updates.condition !== undefined && updates.condition !== existing.condition) {
    changes.push(`Conservação: ${existing.condition} → ${updates.condition}`);
  }
  if (updates.responsible !== undefined && updates.responsible !== (existing.responsible ?? null)) {
    changes.push(`Responsável: ${existing.responsible || '—'} → ${updates.responsible || '—'}`);
  }

  const updateOperation = { $set: updates };
  if (changes.length > 0) {
    updateOperation.$push = {
      movements: {
        id: crypto.randomUUID(),
        type: updates.location !== undefined && updates.location !== existing.location
          ? 'Transferência'
          : 'Alteração de status',
        description: changes.join(' · '),
        location: updates.location !== undefined ? updates.location : existing.location ?? null,
        responsible:
          updates.responsible !== undefined ? updates.responsible : existing.responsible ?? null,
        status: updates.status || existing.status,
        condition: updates.condition || existing.condition,
        createdAt: now
      }
    };
  }

  const updated = await patrimonies.findOneAndUpdate(
    { _id: itemObjectId, userId: userObjectId, deletedAt: null },
    updateOperation,
    { returnDocument: 'after' }
  );

  return mapRow(updated);
};

const addMovement = async (userId, id, payload) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const patrimonies = await getCollection('patrimonies');
  const existing = await patrimonies.findOne({
    _id: itemObjectId,
    userId: userObjectId,
    deletedAt: null
  });
  if (!existing) return null;

  const now = new Date();
  const setUpdates = { updatedAt: now };
  if (payload.location !== undefined) setUpdates.location = payload.location || null;
  if (payload.responsible !== undefined) setUpdates.responsible = payload.responsible || null;
  if (payload.status !== undefined) setUpdates.status = payload.status;
  if (payload.condition !== undefined) setUpdates.condition = payload.condition;

  const movement = {
    id: crypto.randomUUID(),
    type: payload.type || 'Observação',
    description: payload.description,
    location: payload.location !== undefined ? payload.location : existing.location ?? null,
    responsible:
      payload.responsible !== undefined ? payload.responsible : existing.responsible ?? null,
    status: payload.status || existing.status,
    condition: payload.condition || existing.condition,
    createdAt: now
  };

  const updated = await patrimonies.findOneAndUpdate(
    { _id: itemObjectId, userId: userObjectId, deletedAt: null },
    {
      $set: setUpdates,
      $push: { movements: movement }
    },
    { returnDocument: 'after' }
  );

  return mapRow(updated);
};

const softDelete = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return false;

  const now = new Date();
  const patrimonies = await getCollection('patrimonies');
  const result = await patrimonies.updateOne(
    { _id: itemObjectId, userId: userObjectId, deletedAt: null },
    { $set: { deletedAt: now, updatedAt: now } }
  );
  return result.modifiedCount > 0;
};

const setImage = async (userId, id, imageUrl) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return false;

  const patrimonies = await getCollection('patrimonies');
  const result = await patrimonies.updateOne(
    { _id: itemObjectId, userId: userObjectId, deletedAt: null },
    { $set: { imageUrl, updatedAt: new Date() } }
  );
  return result.matchedCount > 0;
};

const getSummary = async (userId) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return {
      totals: {
        items: 0,
        active: 0,
        inactive: 0,
        discarded: 0,
        totalValue: 0,
        activeValue: 0,
        inactiveValue: 0,
        discardedValue: 0,
        depreciatedValue: 0
      },
      byCategory: [],
      byCondition: [],
      valueHistory: [],
      recent: []
    };
  }

  const patrimonies = await getCollection('patrimonies');
  const baseMatch = { userId: userObjectId, deletedAt: null };
  const lineTotalExpr = { $multiply: ['$value', { $ifNull: ['$quantity', 1] }] };

  const [allDocs, byCategoryDocs, byConditionDocs, historyDocs, recentDocs] = await Promise.all([
    patrimonies.find(baseMatch).toArray(),
    patrimonies
      .aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$category',
            items: { $sum: 1 },
            value: { $sum: lineTotalExpr }
          }
        },
        { $sort: { items: -1, _id: 1 } }
      ])
      .toArray(),
    patrimonies
      .aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$condition',
            items: { $sum: 1 }
          }
        },
        { $sort: { items: -1, _id: 1 } }
      ])
      .toArray(),
    patrimonies
      .aggregate([
        {
          $match: {
            ...baseMatch,
            status: 'Ativo',
            condition: { $ne: 'Descartado' }
          }
        },
        {
          $group: {
            _id: { $substrBytes: ['$purchaseDate', 0, 7] },
            value: { $sum: lineTotalExpr }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray(),
    patrimonies.find(baseMatch).sort({ createdAt: -1, _id: -1 }).limit(5).toArray()
  ]);

  let items = 0;
  let active = 0;
  let inactive = 0;
  let discarded = 0;
  let totalValue = 0;
  let activeValue = 0;
  let inactiveValue = 0;
  let discardedValue = 0;
  let depreciatedValue = 0;

  allDocs.forEach((doc) => {
    items += 1;
    const lineValue = toNumber(doc.value) * (doc.quantity || 1);
    totalValue += lineValue;
    const dep = calculateDepreciation(doc);
    depreciatedValue += dep.totalDepreciatedValue;

    if (doc.condition === 'Descartado') {
      discarded += 1;
      discardedValue += lineValue;
    } else if (doc.status === 'Ativo') {
      active += 1;
      activeValue += lineValue;
    } else {
      inactive += 1;
      inactiveValue += lineValue;
    }
  });

  let cumulative = 0;
  const valueHistory = historyDocs.map((row) => {
    cumulative += toNumber(row.value);
    return {
      month: row._id,
      value: Number(cumulative.toFixed(2))
    };
  });

  return {
    totals: {
      items,
      active,
      inactive,
      discarded,
      totalValue: Number(totalValue.toFixed(2)),
      activeValue: Number(activeValue.toFixed(2)),
      inactiveValue: Number(inactiveValue.toFixed(2)),
      discardedValue: Number(discardedValue.toFixed(2)),
      depreciatedValue: Number(depreciatedValue.toFixed(2))
    },
    byCategory: byCategoryDocs.map((row) => ({
      category: row._id,
      items: row.items,
      value: Number(toNumber(row.value).toFixed(2))
    })),
    byCondition: byConditionDocs.map((row) => ({
      condition: row._id,
      items: row.items
    })),
    valueHistory,
    recent: recentDocs.map(mapRow)
  };
};

module.exports = {
  mapRow,
  list,
  findById,
  findBySerialPublic,
  serialExists,
  create,
  update,
  addMovement,
  softDelete,
  setImage,
  getSummary
};
