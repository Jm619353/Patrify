const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../shared/errors/ApiError');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadBytes,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(
        ApiError.badRequest('Formato de imagem não suportado. Use JPEG, PNG ou WEBP.', {
          code: 'UNSUPPORTED_IMAGE_TYPE'
        })
      );
    }
    return callback(null, true);
  }
});

module.exports = { upload };
