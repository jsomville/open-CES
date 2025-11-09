import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllMerchant, getMerchant, addMerchant, modifyMerchant, removeMerchant } from '../controller/merchantController.js'

import { validate } from '../middleware/validate.js';
import { createMerchantSchema, modifyMerchantSchema, merchantIdSchema } from '../schema/merchant.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

router.use(authenticateToken);
router.use(rate_limiter_by_sub);

// get all
router.get('/', authorizeRole("admin"), getAllMerchant);

// get one
router.get('/:id', authorizeRole("admin"), validate(merchantIdSchema), getMerchant);

// gcreate
router.post('/', authorizeRole("admin"), validate(createMerchantSchema), addMerchant);

// modify
router.put('/:id', authorizeRole("admin"), validate(modifyMerchantSchema), modifyMerchant);

// delete
router.delete('/:id', authorizeRole("admin"), validate(merchantIdSchema), removeMerchant);

export default router;