import express from 'express';

import { login, refresh, logout } from '../controller/idpController.js';
import { rate_limiter_by_ip } from "../middleware/rate-limiter.js";
import { authenticateToken } from '../middleware/auth.js';

import { validate } from '../middleware/validate.js';
import { loginSchema, emptyApiSchema, refreshApiSchema} from '../controller/idpSchema.js';

const router = express.Router();

router.use(rate_limiter_by_ip);

// Login
router.post('/login', validate(loginSchema), login)

//Refresh
router.post('/refresh', validate(refreshApiSchema), refresh)

//Logout
router.post('/logout', authenticateToken, validate(emptyApiSchema), logout)

export default router;