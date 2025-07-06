import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllMerchant, getMerchant, createMerchant, updateMerchant, deleteMerchant } from '../controller/merchantController.js'

import { validate2 } from '../middleware/validate.js';
import { createMerchantSchema, modifyMerchantSchema, merchentIdSchema } from '../controller/merchant.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

router.use(authenticateToken);
router.use(rate_limiter_by_sub);

// get all
router.get('/', authorizeRole("admin"), getAllMerchant);

// get one
router.get('/:id', authorizeRole("admin"), validate2(merchentIdSchema), getMerchant);

// gcreate
router.post('/', authorizeRole("admin"), validate2(createMerchantSchema), createMerchant);

// modify
router.put('/:id', authorizeRole("admin"), validate2(modifyMerchantSchema), updateMerchant);

// delete
router.delete('/:id', authorizeRole("admin"), validate2(merchentIdSchema), deleteMerchant);

export default router;