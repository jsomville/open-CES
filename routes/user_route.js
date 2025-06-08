import express from 'express';

import { authenticateToken } from '../middleware/auth.js'
import { authorizeRole } from '../middleware/authorizeRole.js'

import { getAllUsers, getUser, createUser, updateUser, deleteUser, setUserAdmin, setUserActive } from '../controller/userController.js'
import { getUserDetail } from '../controller/userDetailController.js'

const router = express.Router();

// Use the Auth Middleware for all routes
router.use(authenticateToken);

// get all users
router.get('/', authorizeRole("admin"), getAllUsers);

// get user by ID
router.get('/:id', authorizeRole("admin"), getUser);

// create user
router.post('/', authorizeRole("admin"), createUser);

// modify user
router.put('/:id', authorizeRole("admin"), updateUser);

// delete user
router.delete('/:id', authorizeRole("admin"), deleteUser);

//set admin
router.post('/:id/set-admin', authorizeRole("admin"), setUserAdmin);

//set active
router.post('/:id/set-active', authorizeRole("admin"), setUserActive);

// get user by Email
router.get('/by-email/:email', authorizeRole("admin", "user"), getUserDetail);

export default router;