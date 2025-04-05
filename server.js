import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

//Import Middleware
import logger from './middleware/logger.js';
import errorHanlder from './middleware/error.js';
import notFoundHandler from './middleware/notFound.js';

//Routes
import home_route from './routes/home_route.js';
import test_route from './routes/user_route.js';
import idp_route from './routes/idp_route.js';
import currency_route from './routes/currency_route.js'

//Server Configurations
const VERSION = process.version
const PORT = process.env.PORT || 8000


//get DIR name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express object
const app = express();


//Body parser middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}));


//Add Middleware
app.use(logger);


//Add static folder for templates & assets
app.use(express.static(path.join(__dirname, 'public')));


//Add the routes
app.use('/', home_route);
app.use('/api/idp', idp_route);
app.use('/api/currency', currency_route);
app.use('/api/user', test_route);


//Add error Handler
app.use(notFoundHandler);
app.use(errorHanlder);


//Run the server
app.listen(PORT, () => {
    let environement = "in DEV";
    if (process.env.ENVIRO === "PRD"){
        environement = "in production";
    }

    console.log (`Server is running on port ${PORT} ${environement}`);
})