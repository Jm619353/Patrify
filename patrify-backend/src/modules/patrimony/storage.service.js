const fs = require('fs/promises');
const path = require('path');
const env = require('../../config/env');
const logger = require('../../config/logger');
const ApiError = require('../../shared/errors/ApiError');

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const ensureUploadDir = async () => {
  await fs.mkdir(env.uploadDir, { recursive: true });
};

const storeLocally = async (file, filename) => {
  await ensureUploadDir();
  const filePath = path.join(env.uploadDir, filename);
  await fs.writeFile(filePath, file.buffer);
  return `${env.BASE_URL}/uploads/${filename}`;
};

const storeOnVercelBlob = async (file, filename) => {
  try {
    // eslint-disable-next-line global-require
    const { put } = require('@vercel/blob');
    const blob = await put(`patrimonies/${filename}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  } catch (error) {
    logger.error({ err: error }, 'Falha ao enviar imagem para o Vercel Blob');
    throw ApiError.serviceUnavailable('Não foi possível armazenar a imagem.', {
      code: 'IMAGE_STORAGE_UNAVAILABLE'
    });
  }
};

const storeImage = async ({ file, userId, patrimonyId }) => {
  if (!file) {
    throw ApiError.badRequest('Nenhuma imagem foi enviada.', { code: 'MISSING_IMAGE' });
  }

  const extension = EXTENSION_BY_MIME[file.mimetype];
  if (!extension) {
    throw ApiError.badRequest('Formato de imagem não suportado.', {
      code: 'UNSUPPORTED_IMAGE_TYPE'
    });
  }

  const filename = `patrimony-${userId}-${patrimonyId}-${Date.now()}.${extension}`;

  if (env.BLOB_READ_WRITE_TOKEN) {
    return storeOnVercelBlob(file, filename);
  }

  return storeLocally(file, filename);
};

const removeLocalImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith(`${env.BASE_URL}/uploads/`)) return;
  const filename = imageUrl.split('/uploads/')[1];
  if (!filename) return;
  await fs.unlink(path.join(env.uploadDir, filename)).catch(() => undefined);
};

module.exports = { storeImage, removeLocalImage };
