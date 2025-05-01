import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getCurrency, createCurrency, getAllCurrencies, updateCurrency, deleteCurrency} from '../controller/currencyController.js'

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken)

router.get('/', authorizeRole("admin", "user"), getAllCurrencies, )

router.get('/:id', authorizeRole("admin"), getCurrency)

router.post('/', authorizeRole("admin"), createCurrency)

router.put('/:id', authorizeRole("admin"), updateCurrency)

router.delete('/:id', authorizeRole("admin"), deleteCurrency)

export default router;