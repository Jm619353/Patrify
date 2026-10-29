const { ZodError } = require('zod');
const multer = require('multer');
const logger = require('../config/logger');
const env = require('../config/env');
const ApiError = require('../shared/errors/ApiError');

const notFound = (req, res, next) => {
  next(
    ApiError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`, {
      code: 'ROUTE_NOT_FOUND'
    })
  );
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let normalized = error;

  if (error instanceof ZodError) {
    normalized = ApiError.unprocessable('Dados inválidos na requisição.', {
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  } else if (error instanceof multer.MulterError) {
    normalized =
      error.code === 'LIMIT_FILE_SIZE'
        ? ApiError.badRequest(`A imagem deve ter no máximo ${env.MAX_UPLOAD_MB} MB.`, {
            code: 'FILE_TOO_LARGE'
          })
        : ApiError.badRequest('Falha no upload do arquivo.', { code: error.code });
  } else if (error.type === 'entity.parse.failed') {
    normalized = ApiError.badRequest('JSON inválido no corpo da requisição.', {
      code: 'INVALID_JSON'
    });
  } else if (error.code === 11000) {
    normalized = ApiError.conflict('Registro duplicado.', {
      code: 'DUPLICATE_RESOURCE',
      details: error.keyValue
    });
  } else if (error.name === 'BSONError' || error.name === 'BSONTypeError') {
    normalized = ApiError.badRequest('Formato de identificador inválido.', {
      code: 'INVALID_INPUT_SYNTAX'
    });
  } else if (!(error instanceof ApiError)) {
    normalized = new ApiError(500, 'Erro interno do servidor.', { code: 'INTERNAL_ERROR' });
  }

  if (normalized.statusCode >= 500) {
    logger.error({ err: error, requestId: req.id, path: req.originalUrl }, 'Erro não tratado');
  } else {
    logger.warn(
      { code: normalized.code, statusCode: normalized.statusCode, path: req.originalUrl },
      normalized.message
    );
  }

  const body = {
    error: {
      code: normalized.code,
      message: normalized.message
    },
    requestId: req.id
  };

  if (normalized.details) body.error.details = normalized.details;
  if (!env.isProduction && normalized.statusCode >= 500) body.error.stack = error.stack;

  res.status(normalized.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
