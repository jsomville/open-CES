import express from 'express';

import { getAllVouchers, getVoucher, createVoucher, updateVoucher, claimVoucher } from '../controller/voucherController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { validate } from '../middleware/validate.js';
import { createVoucherSchema, modifyVoucherSchema, voucherIdSchema } from '../controller/voucher.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

router.use(authenticateToken);
router.use(rate_limiter_by_sub);

router.get('/', authorizeRole("admin"), getAllVouchers)

router.get('/:id', authorizeRole("admin"), validate(voucherIdSchema), getVoucher)

router.post('/', authorizeRole("admin"), validate(createVoucherSchema), createVoucher)

router.put('/:id', authorizeRole("admin"), validate(modifyVoucherSchema), updateVoucher)

router.post('/claim', authorizeRole("admin", "user"), claimVoucher)

// NO delete Voucher required

export default router;