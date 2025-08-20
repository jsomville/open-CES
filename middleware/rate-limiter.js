import redisHelper from '../utils/redisHelper.js'

const windowsMS = 60000; // in ms
const limit = 15; // number of requests

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const rate_limiter_by_sub = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.sub) return next();

  if (!process.env.IS_TESTING) {
    const key = "RL" + req.user.sub;

    const remaining = await rate_limiter_by_key(key, res);

    // check limit & send error
    if (remaining <= 0) {
      //Add retry After header
      const retryAfter = Math.ceil((callsHistory[0] + windowsMS - now) / 1000);
      res.set('Retry-After', Math.max(retryAfter, 1));

      //Send error
      const error = new Error('Too many requests');
      error.status = 429;
      next(error);
    }
    else {
      next();
    }
  }
  else {
    next();
  }
});

export const rate_limiter_by_ip = asyncHandler(async (req, res, next) => {
  if (!process.env.IS_TESTING) {
    const key = "RL" + req.ip;

    const remaining = await rate_limiter_by_key(key, res);

    // check limit & send error
    if (remaining <= 0) {
      const error = new Error('Too many requests');
      error.status = 429;
      next(error);
    }
    else {
      next();
    }
  }
  else {
    next();
  }
});

async function rate_limiter_by_key(key, res) {
  const now = Date.now();

  const raw = await redisHelper.get(key);
  let callsHistory = raw ? JSON.parse(raw) : [];

  if (callsHistory) {
    // remove expired timestamps
    const cutoff = now - windowsMS;
    while (callsHistory.length && callsHistory[0] < cutoff) {
      callsHistory.shift();
    }
  }

  //push current date/time
  callsHistory.push(now);

  //Update limit in cache
  const ttlSeconds = Math.ceil(windowsMS / 1000);
  await redisHelper.set(key, JSON.stringify(callsHistory), ttlSeconds);

  const remaining = Math.max(limit - callsHistory.length, 0);

  // Update response header for remaining rate limit
  res.set('X-RateLimit-Remaining', remaining);
  res.set('X-RateLimit-Limit', limit);


  return remaining;
};