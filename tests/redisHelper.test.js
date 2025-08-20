import assert from 'node:assert';
import RedisHelper from '../utils/redisHelper.js';
import { redisClient } from '../utils/redisClient.js';

describe('RedisHelper', () => {
    let originalSet;
    let originalGet;
    let originalDel;
    let originalExists;

    let store;
    let expirations;

    const now = () => Date.now();
    const checkExpiration = (key) => {
        const expiry = expirations.get(key);
        if (expiry && now() >= expiry) {
            store.delete(key);
            expirations.delete(key);
        }
    };

    before(() => {
        originalSet = redisClient.set;
        originalGet = redisClient.get;
        originalDel = redisClient.del;
        originalExists = redisClient.exists;

        store = new Map();
        expirations = new Map();

        redisClient.set = async (key, value, options = undefined) => {
            if (options && typeof options.EX === 'number') {
                expirations.set(key, now() + options.EX * 1000);
            } else {
                expirations.delete(key);
            }
            store.set(key, value);
            return 'OK';
        };

        redisClient.get = async (key) => {
            checkExpiration(key);
            return store.has(key) ? store.get(key) : null;
        };

        redisClient.del = async (key) => {
            checkExpiration(key);
            const existed = store.delete(key);
            expirations.delete(key);
            return existed ? 1 : 0;
        };

        redisClient.exists = async (key) => {
            checkExpiration(key);
            return store.has(key) ? 1 : 0;
        };
    });

    after(() => {
        redisClient.set = originalSet;
        redisClient.get = originalGet;
        redisClient.del = originalDel;
        redisClient.exists = originalExists;
    });

    beforeEach(() => {
        store = new Map();
        expirations = new Map();
    });

    it('sets and gets a value without TTL', async () => {
        await RedisHelper.set('k1', 'v1');
        const value = await RedisHelper.get('k1');
        assert.strictEqual(value, 'v1');

        const exists = await RedisHelper.exists('k1');
        assert.strictEqual(exists, true);
    });

    it('deletes a value and returns proper count', async () => {
        await RedisHelper.set('kDel', 'v');
        const deleted = await RedisHelper.del('kDel');
        assert.strictEqual(deleted, 1);

        const deletedAgain = await RedisHelper.del('kDel');
        assert.strictEqual(deletedAgain, 0);
    });

    it('sets a value with TTL and expires correctly', async () => {
        await RedisHelper.set('k2', 'v2', 1);
        const existsNow = await RedisHelper.exists('k2');
        assert.strictEqual(existsNow, true);

        await new Promise((resolve) => setTimeout(resolve, 1100));

        const valueAfter = await RedisHelper.get('k2');
        assert.strictEqual(valueAfter, null);

        const existsAfter = await RedisHelper.exists('k2');
        assert.strictEqual(existsAfter, false);
    });
});


