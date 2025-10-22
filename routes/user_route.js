import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllUsers, getUser, createUser, updateUser, deleteUser, setUserAdmin, setUserActive } from '../controller/userController.js'
import { getUserDetail, getUserDetailByEmail } from '../controller/userDetailController.js'

import { validate } from '../middleware/validate.js';
import { createUserSchema, modifyUserSchema, userIdSchema } from '../controller/user.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);
router.use(rate_limiter_by_sub);

// get all users
router.get('/', authorizeRole("admin"), getAllUsers);

// get current user
router.get('/me', authorizeRole("admin", "user"), getUserDetail);

// get user by ID
router.get('/:id', authorizeRole("admin"), validate(userIdSchema), getUser);

// create user
router.post('/', authorizeRole("admin"), validate(createUserSchema), createUser);

// modify user
router.put('/:id', authorizeRole("user", "admin"), validate(modifyUserSchema), updateUser);

// delete user
router.delete('/:id', authorizeRole("admin"), validate(userIdSchema), deleteUser);

//set admin
router.post('/:id/set-admin', authorizeRole("admin"), setUserAdmin);

//set active
router.post('/:id/set-active', authorizeRole("admin"), setUserActive);

// get user by Email
router.get('/by-email/:email', authorizeRole("admin", "user"), getUserDetailByEmail);


export default router;