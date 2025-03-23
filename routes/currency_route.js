import express from 'express';

import { createCurrency, getAllCurrencies } from '../controller/currencyController.js'

const router = express.Router();

router.post('/', createCurrency)

router.get('/', getAllCurrencies)

export default router;