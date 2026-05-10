import { redisClient } from './redisClient.ts';

export default class RedisHelper {
  static TTL = {
    short: 10,      // 10 seconds
    long: 60,       // 1 minute
    day: 86400      // 24 hours
  };

  static async set(key: string, value: string, ttlInSeconds: number | null = null) {
    if (ttlInSeconds) {
      await redisClient.set(key, value, { EX: ttlInSeconds });
    } else {
      await redisClient.set(key, value);
    }
  }

  static async get(key: string) {
    return await redisClient.get(key);
  }

  static async del(key: string) {
    return await redisClient.del(key);
  }

  static async exists(key: string) {
    const result = await redisClient.exists(key);
    return result === 1;
  }

  static async incr(key: string) {
    return await redisClient.incr(key);
  }
}