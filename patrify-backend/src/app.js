const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { ping } = require('./config/database');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = env.corsOrigins.includes(origin);
    const isLocalhost =
      !env.isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (isAllowed || isLocalhost) return callback(null, true);

    logger.warn({ origin }, 'Origem bloqueada pelo CORS');
    return callback(new Error('Origem não permitida pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86_400
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode })
    }
  })
);

app.use(globalLimiter);

app.use('/uploads', express.static(env.uploadDir, { maxAge: '7d', index: false }));

app.get('/', (req, res) => {
  res.json({
    data: {
      name: 'Patrify API',
      version: '2.0.0',
      documentation: '/api/health',
      environment: env.NODE_ENV
    }
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({
      data: {
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        database: 'connected'
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Health check falhou');
    res.status(503).json({
      data: {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'unavailable'
      }
    });
  }
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
