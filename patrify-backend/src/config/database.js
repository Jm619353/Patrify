const { MongoClient, ObjectId } = require('mongodb');
const env = require('./env');
const logger = require('./logger');

const client = new MongoClient(env.mongodbUri, {
  maxPoolSize: env.DB_POOL_MAX,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000
});

let connectPromise = null;

client.on('error', (error) => {
  logger.error({ err: error }, 'Erro inesperado no cliente do MongoDB');
});

const connect = async () => {
  if (!connectPromise) {
    connectPromise = client.connect().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }
  await connectPromise;
  return client.db(env.mongodbDbName);
};

const getDb = () => connect();

const getCollection = async (name) => {
  const db = await getDb();
  return db.collection(name);
};

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  const str = String(id).trim();
  if (!ObjectId.isValid(str) || str.length !== 24) return null;
  return new ObjectId(str);
};

const ensureIndexes = async () => {
  const db = await getDb();
  const users = db.collection('users');
  const patrimonies = db.collection('patrimonies');
  const maintenances = db.collection('maintenances');
  const loans = db.collection('loans');
  const insurances = db.collection('insurances');

  await Promise.all([
    users.createIndex({ cnpj: 1 }, { unique: true, name: 'ux_users_cnpj' }),
    users.createIndex({ email: 1 }, { unique: true, name: 'ux_users_email' }),
    patrimonies.createIndex({ serialNumber: 1 }, { unique: true, name: 'ux_patrimonies_serial' }),
    patrimonies.createIndex(
      { userId: 1, deletedAt: 1 },
      { name: 'ix_patrimonies_user_deleted' }
    ),
    patrimonies.createIndex({ userId: 1, status: 1 }, { name: 'ix_patrimonies_user_status' }),
    patrimonies.createIndex(
      { userId: 1, category: 1 },
      { name: 'ix_patrimonies_user_category' }
    ),
    patrimonies.createIndex({ purchaseDate: 1 }, { name: 'ix_patrimonies_purchase_date' }),
    patrimonies.createIndex({ name: 1 }, { name: 'ix_patrimonies_name' }),
    maintenances.createIndex({ userId: 1, status: 1 }, { name: 'ix_maintenances_user_status' }),
    maintenances.createIndex(
      { userId: 1, patrimonyId: 1 },
      { name: 'ix_maintenances_user_patrimony' }
    ),
    loans.createIndex({ userId: 1, status: 1 }, { name: 'ix_loans_user_status' }),
    loans.createIndex({ userId: 1, patrimonyId: 1 }, { name: 'ix_loans_user_patrimony' }),
    insurances.createIndex({ userId: 1, status: 1 }, { name: 'ix_insurances_user_status' }),
    insurances.createIndex(
      { userId: 1, patrimonyId: 1 },
      { name: 'ix_insurances_user_patrimony' }
    )
  ]);
};

const ping = async () => {
  const db = await getDb();
  await db.command({ ping: 1 });
  return true;
};

const close = async () => {
  connectPromise = null;
  await client.close();
};

module.exports = {
  client,
  ObjectId,
  connect,
  getDb,
  getCollection,
  toObjectId,
  ensureIndexes,
  ping,
  close
};
