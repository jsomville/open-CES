import express from 'express';

import {getAllUsers, getUser, createUser, updateUser, deleteUser, setUserAdmin} from '../controller/userController.js'

const router = express.Router();

// get all users
router.get('/', getAllUsers)

// get all users
router.get('/:id', getUser)

// create user
router.post('/', createUser)

// modify user
router.put('/:id', updateUser)

// delete user
router.delete('/:id', deleteUser)

//set as admin
router.post('/:id/set-admin', setUserAdmin)

export default router;