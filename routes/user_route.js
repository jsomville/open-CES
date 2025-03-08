import express from 'express';

import {getUsers, getUser, createUser, updateUser, deleteUser} from '../controller/userController.js'

const router = express.Router();


// get all users
router.get('/', getUsers)

// get all users
router.get('/:id', getUser)

// get all users
router.post('/', createUser)

// get all users
router.put('/', updateUser)

// get all users
router.delete('/', deleteUser)

export default router;