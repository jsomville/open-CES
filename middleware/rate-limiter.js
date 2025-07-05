import redisHelper from '../utils/redisHelper.js'

const windowsMS = 60000; // in ms
const limit = 15; // number of requests

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const rate_limiter_by_sub = asyncHandler(async (req, res, next) => {
  if (!process.env.isTesting) {
    const key = "RL" + req.user.sub;

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

export async function reset_rate_limiter_by_sub(sub) {
  const key = "RL" + sub;

  //await redisHelper.del(key);
}

export const rate_limiter_by_ip = asyncHandler(async (req, res, next) => {
  if (!process.env.isTesting) {
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

export async function reset_rate_limiter_by_ip(ip) {
  const key = "RL" + ip;

  //await redisHelper.del(key);
}

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
  redisHelper.set(key, JSON.stringify(callsHistory), windowsMS);

  const remaining = Math.max(limit - callsHistory.length, 0);

  // Update response header for remaining rate limit
  res.set('X-RateLimit-Remaining', remaining);

  return remaining;
};