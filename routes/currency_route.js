import express from 'express';

import { getCurrency, createCurrency, getAllCurrencies, updateCurrency, deleteCurrency} from '../controller/currencyController.js'

const router = express.Router();

router.get('/', getAllCurrencies)

router.get('/:id', getCurrency)

router.post('/', createCurrency)

router.put('/:id', updateCurrency)

router.delete('/:id', deleteCurrency)

export default router;