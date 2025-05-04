import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getCurrency, createCurrency, getAllCurrencies, updateCurrency, deleteCurrency} from '../controller/currencyController.js'

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken)

//get all currency
router.get('/', authorizeRole("admin", "user"), getAllCurrencies, )

//get currency by ID
router.get('/:id', authorizeRole("admin"), getCurrency)

//create currency
router.post('/', authorizeRole("admin"), createCurrency)

//modify currency
router.put('/:id', authorizeRole("admin"), updateCurrency)

//delete currency
router.delete('/:id', authorizeRole("admin"), deleteCurrency)

export default router;