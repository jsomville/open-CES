import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { validate } from '../middleware/validate.js';

import { getAllAccount, getAccount, addAccount, removeAccount, transferToAccount, getTransactions, getTransactionsByPage, getAccountInfoByEmailAndSymbol, getAccountInfoByPhoneAndSymbol } from '../controller/accountController.js'
import { createAccountSchema, accountIdSchema, accountTransferSchema, accountInfoByEmail, accountInfoByPhone, accountIdTransactionPageSchema} from '../schema/account.schema.js'

import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);
router.use(rate_limiter_by_sub);

//get All account
router.get('/', authorizeRole("admin"), getAllAccount);

//get account by number
router.get('/:number', authorizeRole("admin"), validate(accountIdSchema), getAccount);

//create account
router.post('/', authorizeRole("admin"), validate(createAccountSchema), addAccount);

//Modify account    
//Account cannot be modified

//delete account
router.delete('/:number', authorizeRole("admin"), validate(accountIdSchema), removeAccount);

//Transfer To
router.post("/:number/transferTo", authorizeRole("admin", "user"), validate(accountTransferSchema), transferToAccount);

//Transaction from account
router.get("/:number/transactions", authorizeRole("admin", "user"), validate(accountIdSchema), getTransactions);

//Transaction from account
router.get("/:number/transactions-by-page", authorizeRole("admin", "user"), validate(accountIdTransactionPageSchema), getTransactionsByPage);

//get Account info from email and currency
router.post('/by-email-and-symbol', authorizeRole("admin", "user"), validate(accountInfoByEmail), getAccountInfoByEmailAndSymbol);

//get Account info from email and currency
router.post('/by-phone-and-symbol', authorizeRole("admin", "user"), validate(accountInfoByPhone), getAccountInfoByPhoneAndSymbol);

export default router;