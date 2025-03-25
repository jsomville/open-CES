import express from 'express';

import { createCurrency, getAllCurrencies, updateCurrency, deleteCurrency} from '../controller/currencyController.js'

const router = express.Router();

router.post('/', createCurrency)

router.get('/', getAllCurrencies)

router.put('/:id', updateCurrency)

router.delete('/:id', deleteCurrency)

export default router;