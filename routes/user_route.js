import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllUsers, getUser, addUser, modifyUser, removeUser, setUserAdmin, setUserActive } from '../controller/userController.js'
import { getMe, getUserDetailByEmail } from '../controller/userDetailController.js'

import { validate } from '../middleware/validate.js';
import { createUserSchema, modifyUserSchema, userIdSchema, userEmailSchema, emptyUserSchema} from '../schema/user.schema.js'
import { rate_limiter_by_sub } from "../middleware/rate-limiter.js";

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);
router.use(rate_limiter_by_sub);

// get all users
router.get('/', authorizeRole("admin"), getAllUsers);

// get current user (must be before /:id route)
router.get('/me', authorizeRole("admin", "user"), validate(emptyUserSchema), getMe);

// get user by ID
router.get('/:id', authorizeRole("admin"), validate(userIdSchema), getUser);

// create user
router.post('/', authorizeRole("admin"), validate(createUserSchema), addUser);

// modify user
router.put('/:id', authorizeRole("user", "admin"), validate(modifyUserSchema), modifyUser);

// delete user
router.delete('/:id', authorizeRole("admin"), validate(userIdSchema), removeUser);

//set admin
router.post('/:id/set-admin', authorizeRole("admin"),  validate(userIdSchema), setUserAdmin);

//set active
router.post('/:id/set-active', authorizeRole("admin"), validate(userIdSchema), setUserActive);

// get user by Email
router.get('/by-email/:email', authorizeRole("admin", "user"), validate(userEmailSchema), getUserDetailByEmail);

export default router;