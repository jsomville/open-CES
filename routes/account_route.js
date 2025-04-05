import express from 'express';

import { getAllAccount, getAccount, createAccount, deleteAccount} from '../controller/accountController.js'

const router = express.Router();

router.get('/', getAllAccount)

router.get('/:id', getAccount)

router.post('/', createAccount)

router.delete('/:id', deleteAccount)

export default router;