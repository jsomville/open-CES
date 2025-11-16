import express from 'express';

import { getAllVouchers, getVoucher, addVoucher, modifyVoucher, claimVoucher } from '../controller/voucherController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { validate } from '../middleware/validate.js';
import { createVoucherSchema, modifyVoucherSchema, voucherIdSchema, claimVoucherSchema } from '../schema/voucher.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

router.use(authenticateToken);
router.use(rate_limiter_by_sub);

router.get('/', authorizeRole("admin"), getAllVouchers)

router.get('/:id', authorizeRole("admin"), validate(voucherIdSchema), getVoucher)

router.post('/', authorizeRole("admin"), validate(createVoucherSchema), addVoucher)

router.put('/:id', authorizeRole("admin"), validate(modifyVoucherSchema), modifyVoucher)

router.post('/claim', authorizeRole("admin", "user"), validate(claimVoucherSchema), claimVoucher)

// NO delete Voucher required

export default router;