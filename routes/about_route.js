import express from 'express';

import { rate_limiter_by_ip } from "../middleware/rate-limiter.js";

import { getMobileAppVersion } from '../controller/aboutController.js';

const router = express.Router();

router.use(rate_limiter_by_ip);

router.get('/mobileAppVersion', getMobileAppVersion)

export default router;