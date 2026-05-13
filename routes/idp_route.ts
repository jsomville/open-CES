import express from 'express';

import { login, refresh, logout } from '../controller/idpController.ts';
import { rate_limiter_by_ip } from "../middleware/rate-limiter.ts";
import { authenticateToken } from '../middleware/auth.ts';

import { validate } from '../middleware/validate.ts';
import { loginSchema, emptyApiSchema, refreshApiSchema} from '../schema/idpSchema.ts';

const router = express.Router();

router.use(rate_limiter_by_ip);

// Login
router.post('/login', validate(loginSchema), login)

//Refresh
router.post('/refresh', validate(refreshApiSchema), refresh)

//Logout
router.post('/logout', authenticateToken, validate(emptyApiSchema), logout)

export default router;