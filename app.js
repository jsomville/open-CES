import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'

//Import Middleware
import logger from './middleware/logger.js';
import errorHanlder from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';
import requestDuration from './middleware/requestDuration.js'

import { connectRedis, redisClient } from './redis/redisClient.js';

//Routes
import home_route from './routes/home_route.js';
import idp_route from './routes/idp_route.js';
import user_route from './routes/user_route.js';
import currency_route from './routes/currency_route.js'
import account_route from './routes/account_route.js'
import merchant_route from './routes/merchant_route.js'
import voucher_route from './routes/voucher_route.js'
import test_route from './routes/test_route.js'

//get Dfunctions to deal with static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create Express object
const app = express();


//Use cors
const corsOptions = {
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
}
app.use(cors(corsOptions))


//Hardening
app.disable('x-powered-by')


//Add Middleware
app.use(express.json()); //Json parsing
app.use(express.urlencoded({ extended: false })); //url encoder
app.use(logger); //Logger Middleware
app.use(requestDuration); // add X-response-Time


//Add static folder for templates & assets
app.use(express.static(path.join(__dirname, 'public')));

//Connect Redis
await connectRedis();

//Add the routes
app.use('/', home_route);
app.use('/api/idp', idp_route);
app.use('/api/currency', currency_route);
app.use('/api/user', user_route);
app.use('/api/account', account_route);
app.use('/api/merchant', merchant_route);
app.use('/api/voucher', voucher_route);

//Test Route
app.use('/test', test_route);


//Add error Handler
app.use(notFoundHandler);
app.use(errorHanlder);


//Shutdown gracefully
async function shutdown(arg) {
  //Close Redis
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('✅ Redis disconnected');
    }
    catch (err) {
      console.error('❌ Error disconnecting Redis:', err);
    }
  }
  process.exit(0);
}


if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => shutdown('sigint'));
  process.on('SIGTERM', () => shutdown('sigterm'));
  process.on('exit', () => shutdown('exit'));
}

export { app, shutdown };