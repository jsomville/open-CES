import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllMerchant, getMerchant, createMerchant, updateMerchant, deleteMerchant } from '../controller/merchantController.js'

import { validate } from '../middleware/validate.js';
import { createMerchantSchema, modifyMerchantSchema } from '../controller/merchant.schema.js'

const router = express.Router();

router.use(authenticateToken);

// get all
router.get('/', authorizeRole("admin"), getAllMerchant);

// get one
router.get('/:id', authorizeRole("admin"), getMerchant);

// gcreate
router.post('/', authorizeRole("admin"), validate(createMerchantSchema), createMerchant);

// modify
router.put('/:id', authorizeRole("admin"), validate(modifyMerchantSchema), updateMerchant);

// delete
router.delete('/:id', authorizeRole("admin"), deleteMerchant);

export default router;