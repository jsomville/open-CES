import express from 'express';

import { rate_limiter_by_ip } from "../middleware/rate-limiter.js";

import { getMobileAppVersion, getCurrencies } from '../controller/aboutController.js';

const router = express.Router();

router.use(rate_limiter_by_ip);

router.get('/mobileAppVersion', getMobileAppVersion);

router.get('/currencies', getCurrencies);

export default router;