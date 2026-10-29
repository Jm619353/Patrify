const { ZodError } = require('zod');
const ApiError = require('../shared/errors/ApiError');

const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        ApiError.unprocessable('Dados inválidos na requisição.', {
          code: 'VALIDATION_ERROR',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        })
      );
    }
    return next(error);
  }
};

module.exports = validate;
