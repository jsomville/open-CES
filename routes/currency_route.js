import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getCurrency, getCurrenciesDetails, getAllCurrencies, addCurrency, updateCurrency, deleteCurrency, fundAccount, refundAccount } from '../controller/currencyController.js'

import { validate } from '../middleware/validate.js';
import { createCurrencySchema, modifyCurrencySchema, currencyIdSchema, currencyFundRefundSchema } from '../controller/currency.schema.js'

import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);
router.use(rate_limiter_by_sub);

//get all currency
router.get('/', authorizeRole("admin", "user"), getAllCurrencies);

router.get('/details', authorizeRole("admin", "user"), getCurrenciesDetails);

//get currency by ID
router.get('/:id', authorizeRole("admin"), validate(currencyIdSchema), getCurrency);

//create currency
router.post('/', authorizeRole("admin"), validate(createCurrencySchema), addCurrency);

//modify currency
router.put('/:id', authorizeRole("admin"), validate(modifyCurrencySchema), updateCurrency);

//delete currency
router.delete('/:id', authorizeRole("admin"), validate(currencyIdSchema), deleteCurrency);

//Fund account
router.post('/:id/fundAccount', authorizeRole("admin"), validate(currencyFundRefundSchema), fundAccount);

//Refund account
router.post('/:id/refundAccount', authorizeRole("admin"), validate(currencyFundRefundSchema), refundAccount);

export default router;