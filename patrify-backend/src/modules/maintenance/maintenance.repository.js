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
    title: doc.title,
    type: doc.type,
    priority: doc.priority,
    status: doc.status,
    provider: doc.provider ?? null,
    cost: toNumber(doc.cost),
    scheduledDate: doc.scheduledDate,
    completedAt: doc.completedAt ?? null,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const list = async (userId, filters = {}) => {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return { items: [], summary: { total: 0, open: 0, inProgress: 0, completed: 0, totalCost: 0 } };

  const maintenances = await getCollection('maintenances');
  const query = { userId: userObjectId };

  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.priority) query.priority = filters.priority;
  if (filters.patrimonyId) {
    const patId = toObjectId(filters.patrimonyId);
    if (patId) query.patrimonyId = patId;
  }
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [
      { title: regex },
      { patrimonyName: regex },
      { serialNumber: regex },
      { provider: regex }
    ];
  }

  const [docs, allUserDocs] = await Promise.all([
    maintenances.find(query).sort({ scheduledDate: -1, createdAt: -1 }).toArray(),
    maintenances.find({ userId: userObjectId }).toArray()
  ]);

  let open = 0;
  let inProgress = 0;
  let completed = 0;
  let totalCost = 0;

  allUserDocs.forEach((doc) => {
    if (doc.status === 'Aberta') open += 1;
    else if (doc.status === 'Em andamento') inProgress += 1;
    else if (doc.status === 'Concluída') completed += 1;

    if (doc.status !== 'Cancelada') {
      totalCost += toNumber(doc.cost);
    }
  });

  return {
    items: docs.map(mapRow),
    summary: {
      total: allUserDocs.length,
      open,
      inProgress,
      completed,
      totalCost: Number(totalCost.toFixed(2))
    }
  };
};

const findById = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const maintenances = await getCollection('maintenances');
  const doc = await maintenances.findOne({ _id: itemObjectId, userId: userObjectId });
  return mapRow(doc);
};

const create = async (userId, patrimony, data) => {
  const userObjectId = toObjectId(userId);
  const patrimonyObjectId = toObjectId(patrimony.id);
  const maintenances = await getCollection('maintenances');
  const now = new Date();

  const doc = {
    userId: userObjectId,
    patrimonyId: patrimonyObjectId,
    patrimonyName: patrimony.name,
    serialNumber: patrimony.serialNumber,
    category: patrimony.category,
    title: data.title,
    type: data.type,
    priority: data.priority,
    status: data.status,
    provider: data.provider || null,
    cost: toNumber(data.cost),
    scheduledDate: data.scheduledDate,
    completedAt: data.status === 'Concluída' ? now : null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now
  };

  const result = await maintenances.insertOne(doc);
  return mapRow({ ...doc, _id: result.insertedId });
};

const update = async (userId, id, data) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const maintenances = await getCollection('maintenances');
  const existing = await maintenances.findOne({ _id: itemObjectId, userId: userObjectId });
  if (!existing) return null;

  const now = new Date();
  const updates = { updatedAt: now };

  if (data.title !== undefined) updates.title = data.title;
  if (data.type !== undefined) updates.type = data.type;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'Concluída' && !existing.completedAt) {
      updates.completedAt = now;
    } else if (data.status !== 'Concluída') {
      updates.completedAt = null;
    }
  }
  if (data.provider !== undefined) updates.provider = data.provider || null;
  if (data.cost !== undefined) updates.cost = toNumber(data.cost);
  if (data.scheduledDate !== undefined) updates.scheduledDate = data.scheduledDate;
  if (data.notes !== undefined) updates.notes = data.notes || null;

  const updated = await maintenances.findOneAndUpdate(
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

  const maintenances = await getCollection('maintenances');
  const result = await maintenances.deleteOne({ _id: itemObjectId, userId: userObjectId });
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
