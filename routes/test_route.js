import express from 'express';
import redisHelper from '../redis/redisHelper.js'

const router = express.Router();

router.get('/', async (req, res) => {
    const key = "";
    let data = await redisHelper.get(key);
    let msg = "hit cache : 1";
    if (!data) {
        data = "This is some new data";

        await redisHelper.set(key, data, redisHelper.TTL.short)
        msg = "hit cache : 2";
    }
    const payload = {
        data,
        msg,
    }
    return res.status(200).json(payload)

});

export default router;