const { getCollection, toObjectId } = require('../../config/database');

const mapRow = (doc) => {
  if (!doc) return null;
  return {
    id: String(doc._id),
    patrimonyId: String(doc.patrimonyId),
    patrimonyName: doc.patrimonyName,
    serialNumber: doc.serialNumber,
    category: doc.category,
    borrowerName: doc.borrowerName,
    borrowerDocument: doc.borrowerDocument ?? null,
    department: doc.department,
    purpose: doc.purpose,
    loanDate: doc.loanDate,
    expectedReturnDate: doc.expectedReturnDate,
    returnedAt: doc.returnedAt ?? null,
    status: doc.status,
    conditionOut: doc.conditionOut ?? 'Excelente',
    conditionIn: doc.conditionIn ?? null,
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
      summary: { total: 0, active: 0, overdue: 0, returned: 0 }
    };
  }

  const loans = await getCollection('loans');
  const query = { userId: userObjectId };

  if (filters.status) query.status = filters.status;
  if (filters.patrimonyId) {
    const patId = toObjectId(filters.patrimonyId);
    if (patId) query.patrimonyId = patId;
  }
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [
      { borrowerName: regex },
      { department: regex },
      { patrimonyName: regex },
      { serialNumber: regex },
      { purpose: regex }
    ];
  }

  const [docs, allUserDocs] = await Promise.all([
    loans.find(query).sort({ status: 1, expectedReturnDate: 1, createdAt: -1 }).toArray(),
    loans.find({ userId: userObjectId }).toArray()
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  let active = 0;
  let overdue = 0;
  let returned = 0;

  allUserDocs.forEach((doc) => {
    if (doc.status === 'Em andamento') {
      active += 1;
      if (doc.expectedReturnDate && doc.expectedReturnDate < todayIso) {
        overdue += 1;
      }
    } else if (doc.status === 'Devolvido') {
      returned += 1;
    }
  });

  return {
    items: docs.map(mapRow),
    summary: {
      total: allUserDocs.length,
      active,
      overdue,
      returned
    }
  };
};

const findById = async (userId, id) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const loans = await getCollection('loans');
  const doc = await loans.findOne({ _id: itemObjectId, userId: userObjectId });
  return mapRow(doc);
};

const create = async (userId, patrimony, data) => {
  const userObjectId = toObjectId(userId);
  const patrimonyObjectId = toObjectId(patrimony.id);
  const loans = await getCollection('loans');
  const now = new Date();

  const doc = {
    userId: userObjectId,
    patrimonyId: patrimonyObjectId,
    patrimonyName: patrimony.name,
    serialNumber: patrimony.serialNumber,
    category: patrimony.category,
    borrowerName: data.borrowerName,
    borrowerDocument: data.borrowerDocument || null,
    department: data.department,
    purpose: data.purpose,
    loanDate: data.loanDate,
    expectedReturnDate: data.expectedReturnDate,
    returnedAt: null,
    status: 'Em andamento',
    conditionOut: data.conditionOut || patrimony.condition || 'Excelente',
    conditionIn: null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now
  };

  const result = await loans.insertOne(doc);
  return mapRow({ ...doc, _id: result.insertedId });
};

const update = async (userId, id, data) => {
  const userObjectId = toObjectId(userId);
  const itemObjectId = toObjectId(id);
  if (!userObjectId || !itemObjectId) return null;

  const loans = await getCollection('loans');
  const existing = await loans.findOne({ _id: itemObjectId, userId: userObjectId });
  if (!existing) return null;

  const now = new Date();
  const updates = { updatedAt: now };

  if (data.expectedReturnDate !== undefined) {
    updates.expectedReturnDate = data.expectedReturnDate;
  }
  if (data.conditionIn !== undefined) {
    updates.conditionIn = data.conditionIn || null;
  }
  if (data.notes !== undefined) {
    updates.notes = data.notes || null;
  }
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === 'Devolvido' && !existing.returnedAt) {
      updates.returnedAt = now;
    } else if (data.status !== 'Devolvido') {
      updates.returnedAt = null;
    }
  }

  const updated = await loans.findOneAndUpdate(
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

  const loans = await getCollection('loans');
  const result = await loans.deleteOne({ _id: itemObjectId, userId: userObjectId });
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
