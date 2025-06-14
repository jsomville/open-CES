import express from 'express';

import { getAllVouchers, getVoucher, createVoucher, updateVoucher, claimVoucher } from '../controller/voucherController.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

const router = express.Router();

router.use(authenticateToken)

router.get('/', authorizeRole("admin"), getAllVouchers)

router.get('/:id', authorizeRole("admin"), getVoucher)

router.post('/', authorizeRole("admin"), createVoucher)

router.put('/:id', authorizeRole("admin"), updateVoucher)

router.post('/claim', authorizeRole("admin", "user"), claimVoucher)

// NO delete Voucher required

export default router;