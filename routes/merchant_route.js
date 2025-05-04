import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import {getAllMerchant, getMerchant, createMerchant, updateMerchant, deleteMerchant} from '../controller/merchantController.js'

const router = express.Router();

router.use(authenticateToken);

// get all users
router.get('/', authorizeRole("admin"), getAllMerchant);

// get all users
router.get('/:id', authorizeRole("admin"), getMerchant);

// get all users
router.post('/', authorizeRole("admin"), createMerchant);

// get all users
router.put('/:id', authorizeRole("admin"), updateMerchant);

// get all users
router.delete('/:id', authorizeRole("admin"), deleteMerchant);

export default router;