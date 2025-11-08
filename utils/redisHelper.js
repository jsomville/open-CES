import { redisClient } from './redisClient.js';

export default class RedisHelper {
  static TTL = {
    short: 10,      // 10 seconds
    long: 60,       // 1 minute
    day: 86400      // 24 hours
  };

  static async set(key, value, ttlInSeconds = null) {
    if (ttlInSeconds) {
      await redisClient.set(key, value, { EX: ttlInSeconds });
    } else {
      await redisClient.set(key, value);
    }
  }

  static async get(key) {
    return await redisClient.get(key);
  }

  static async del(key) {
    return await redisClient.del(key);
  }

  static async exists(key) {
    const result = await redisClient.exists(key);
    return result === 1;
  }

  static async incr(key) {
    return await redisClient.incr(key);
  }
}