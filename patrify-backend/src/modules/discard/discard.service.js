const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../config/logger');
const ApiError = require('../../shared/errors/ApiError');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const getCacheKey = ({ material, latitude, longitude, radius }) =>
  `${material.toLowerCase()}|${latitude.toFixed(3)}|${longitude.toFixed(3)}|${radius}`;

const readCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const writeCache = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

const ensureApiKey = () => {
  if (!env.googleMapsApiKey) {
    throw ApiError.serviceUnavailable(
      'A integração com o Google Maps não está configurada neste ambiente.',
      { code: 'GOOGLE_MAPS_NOT_CONFIGURED' }
    );
  }
  return env.googleMapsApiKey;
};

const mapPlace = (place, details) => {
  const detail = details?.result || {};
  const location = detail.geometry?.location || place.geometry?.location;
  return {
    id: place.place_id,
    name: place.name,
    address: detail.formatted_address || place.vicinity || null,
    phone: detail.formatted_phone_number || null,
    website: detail.website || null,
    mapsUrl: detail.url || null,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    rating: place.rating ?? null,
    userRatingsTotal: place.user_ratings_total ?? null,
    openNow: place.opening_hours?.open_now ?? null
  };
};

const search = async ({ material, latitude, longitude, radius }) => {
  const apiKey = ensureApiKey();
  const cacheKey = getCacheKey({ material, latitude, longitude, radius });
  const cached = readCache(cacheKey);
  if (cached) return { items: cached, cached: true };

  let nearbyResponse;
  try {
    nearbyResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        key: apiKey,
        location: `${latitude},${longitude}`,
        radius,
        keyword: `${material} reciclagem ponto de descarte`,
        language: 'pt-BR'
      },
      timeout: 10_000
    });
  } catch (error) {
    logger.error({ err: error }, 'Falha ao consultar o Google Places');
    throw ApiError.serviceUnavailable('Não foi possível consultar os pontos de descarte agora.', {
      code: 'GOOGLE_MAPS_UNAVAILABLE'
    });
  }

  const { status, results = [], error_message: errorMessage } = nearbyResponse.data;

  if (status === 'ZERO_RESULTS') return { items: [], cached: false };

  if (status !== 'OK') {
    logger.warn({ status, errorMessage }, 'Resposta inesperada do Google Places');
    throw ApiError.serviceUnavailable(
      'A busca de pontos de descarte está indisponível no momento. Tente novamente mais tarde.',
      { code: 'GOOGLE_MAPS_ERROR', details: status }
    );
  }

  const selected = results.slice(0, 10);
  const detailsResponses = await Promise.allSettled(
    selected.map((place) =>
      axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          key: apiKey,
          place_id: place.place_id,
          fields:
            'formatted_phone_number,website,url,geometry,formatted_address,name,opening_hours',
          language: 'pt-BR'
        },
        timeout: 8_000
      })
    )
  );

  const items = selected.map((place, index) => {
    const response = detailsResponses[index];
    const details = response.status === 'fulfilled' ? response.value.data : null;
    return mapPlace(place, details);
  });

  writeCache(cacheKey, items);
  return { items, cached: false };
};

module.exports = { search };
