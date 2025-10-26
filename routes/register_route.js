import express from 'express';

import { rate_limiter_by_ip } from "../middleware/rate-limiter.js";

import { validate } from '../middleware/validate.js';

import { register, validateRegistration } from '../controller/registerController.js';

import { registerSchema, registerValidationSchema} from '../controller/registerSchema.js';

const router = express.Router();

router.use(rate_limiter_by_ip);

// Register
router.post('/', validate(registerSchema), register)

router.post('/validate/:code', validate(registerValidationSchema), validateRegistration)

export default router;