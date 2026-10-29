const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { ensureIndexes, close } = require('./config/database');

ensureIndexes().catch((error) => {
  logger.warn({ err: error }, 'Não foi possível garantir os índices do MongoDB na inicialização');
});

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, database: env.mongodbDbName },
    `Patrify API disponível em http://localhost:${env.PORT}`
  );
});

const shutdown = async (signal) => {
  logger.info({ signal }, 'Encerrando servidor...');

  const forceExit = setTimeout(() => {
    logger.error('Encerramento forçado após 10s.');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await close();
      logger.info('Conexões encerradas com sucesso.');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Erro ao encerrar conexões.');
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Promise rejeitada sem tratamento');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Exceção não capturada');
  shutdown('uncaughtException');
});
