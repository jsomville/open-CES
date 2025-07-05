import express from 'express';

import { login, refresh, logout } from '../controller/idpController.js';
import { rate_limiter_by_ip } from "../middleware/rate-limiter.js";


const router = express.Router();

router.use(rate_limiter_by_ip);

// Login
router.post('/login', login)

//Refresh
router.post('/refresh', refresh)

//Logout
router.post('/logout', logout)

export default router;