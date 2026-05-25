import express from 'express';

import { rate_limiter_by_ip } from "../middleware/rate-limiter.ts";

import { validate } from '../middleware/validate.ts';

import { register, validateRegistration } from '../controller/registerController.ts';

import { registerChallengeSchema, registerSchema} from '../schema/registerSchema.ts';

const router = express.Router();

router.use(rate_limiter_by_ip);

// Register
router.post('/', validate(registerSchema), register)

router.post('/challenge', validate(registerChallengeSchema), validateRegistration)

export default router;