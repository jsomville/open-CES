import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllAccount, getAccount, createAccount, deleteAccount, transferTo } from '../controller/accountController.js'

import { validate, validate2 } from '../middleware/validate.js';
import { createAccountSchema, accountIdSchema } from '../controller/account.schema.js'

import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);
router.use(rate_limiter_by_sub);

//get All account
router.get('/', authorizeRole("admin"), getAllAccount);

//get account by id
router.get('/:id', authorizeRole("admin"), validate2(accountIdSchema), getAccount);

//create account
router.post('/', authorizeRole("admin"), validate2(createAccountSchema), createAccount);

//Modify account
//Account cannot be modified

//delete account
router.delete('/:id', authorizeRole("admin"), validate2(accountIdSchema), deleteAccount);

//Transfer To
router.post("/:id/transferTo", authorizeRole("admin", "user"), transferTo);

export default router;