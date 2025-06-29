import { createClient } from 'redis';

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_URL, //'192.168.2.130',
        port: process.env.REDIS_PORT, // 30059,
    },
    password: process.env.REDIS_PWD, //'r3d1s',
});

//On Error
redisClient.on('error', (err) => console.error('Redis Client Error', err));

//Connexion 
async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log('✅ Connected to Redis');
    }
}

export { redisClient, connectRedis };