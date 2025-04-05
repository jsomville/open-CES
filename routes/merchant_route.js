import express from 'express';

import {getAllMerchant, getMerchant, createMerchant, updateMerchant, deleteMerchant} from '../controller/merchantController.js'

const router = express.Router();

// get all users
router.get('/', getAllMerchant)

// get all users
router.get('/:id', getMerchant)

// get all users
router.post('/', createMerchant)

// get all users
router.put('/:id', updateMerchant)

// get all users
router.delete('/:id', deleteMerchant)

export default router;