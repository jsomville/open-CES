import express from 'express';

import {getAllVouchers, getVoucher, createVoucher, updateVoucher} from '../controller/voucherController.js'

const router = express.Router();

// get all vouchers
router.get('/', getAllVouchers)

// get voucher
router.get('/:id', getVoucher)

router.post('/', createVoucher)

router.put('/:id', updateVoucher)

// NO delete Voucher required

export default router;