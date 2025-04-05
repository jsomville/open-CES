import express from 'express';

import {getAllUsers, getUser, createUser, updateUser, deleteUser} from '../controller/userController.js'

const router = express.Router();

// get all users
router.get('/', getAllUsers)

// get all users
router.get('/:id', getUser)

// get all users
router.post('/', createUser)

// get all users
router.put('/:id', updateUser)

// get all users
router.delete('/:id', deleteUser)

export default router;