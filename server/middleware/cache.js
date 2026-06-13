import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

const cacheMiddleware = (duration) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  res.originalJson = res.json;
  res.json = (body) => {
    cache.set(key, body, duration);
    res.originalJson(body);
  };
  next();
};

/** Call after admin creates/updates/deletes content */
const flushCache = () => {
  cache.flushAll();
};

export { cache, cacheMiddleware, flushCache };