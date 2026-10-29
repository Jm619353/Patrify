class ApiError extends Error {
  constructor(statusCode, message, { code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Requisição inválida.', options) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', ...options });
  }

  static unauthorized(message = 'Não autenticado.', options) {
    return new ApiError(401, message, { code: 'UNAUTHORIZED', ...options });
  }

  static forbidden(message = 'Acesso negado.', options) {
    return new ApiError(403, message, { code: 'FORBIDDEN', ...options });
  }

  static notFound(message = 'Recurso não encontrado.', options) {
    return new ApiError(404, message, { code: 'NOT_FOUND', ...options });
  }

  static conflict(message = 'Recurso já existe.', options) {
    return new ApiError(409, message, { code: 'CONFLICT', ...options });
  }

  static unprocessable(message = 'Dados inválidos.', options) {
    return new ApiError(422, message, { code: 'VALIDATION_ERROR', ...options });
  }

  static serviceUnavailable(message = 'Serviço indisponível.', options) {
    return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE', ...options });
  }
}

module.exports = ApiError;
