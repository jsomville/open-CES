import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'

//Import Middleware
import logger from './middleware/logger.js';
import errorHanlder from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';

//Routes
import home_route from './routes/home_route.js';
import idp_route from './routes/idp_route.js';
import user_route from './routes/user_route.js';
import currency_route from './routes/currency_route.js'
import account_route from './routes/account_route.js'
import merchant_route from './routes/merchant_route.js'
import voucher_route from './routes/voucher_route.js'


//get DIR name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express object
const app = express();

//Use cors 
//app.use(cors)

//Hardening
app.disable('x-powered-by')

//Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Add Middleware
app.use(logger);


//Add static folder for templates & assets
app.use(express.static(path.join(__dirname, 'public')));


//Add the routes
app.use('/', home_route);
app.use('/api/idp', idp_route);
app.use('/api/currency', currency_route);
app.use('/api/user', user_route);
app.use('/api/account', account_route);
app.use('/api/merchant', merchant_route);
app.use('/api/voucher', voucher_route);


//Add error Handler
app.use(notFoundHandler);
app.use(errorHanlder);

export default app;