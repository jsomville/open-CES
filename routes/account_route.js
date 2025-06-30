import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllAccount, getAccount, createAccount, deleteAccount, transferTo } from '../controller/accountController.js'

import { validate } from '../middleware/validate.js';
import { createAccountSchema } from '../controller/account.schema.js'

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);

//get All account
router.get('/', authorizeRole("admin"), getAllAccount);

//get account by id
router.get('/:id', authorizeRole("admin"), getAccount);

//create account
router.post('/', authorizeRole("admin"), validate(createAccountSchema), createAccount);

//Modify account
//Account cannot be modified

//delete account
router.delete('/:id', authorizeRole("admin"), deleteAccount);

//Transfer To
router.post("/:id/transferTo", authorizeRole("admin", "user"), transferTo);

export default router;