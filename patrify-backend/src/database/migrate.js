const { ensureIndexes, close } = require('../config/database');
const logger = require('../config/logger');

const run = async () => {
  await ensureIndexes();
  logger.info('Índices e coleções do MongoDB configurados com sucesso');
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => close());
