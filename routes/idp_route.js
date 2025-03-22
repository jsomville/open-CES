import express from 'express';

import {login, logout} from '../controller/idpController.js'

const router = express.Router();

// Login
router.post('/login', login)

//Logout
router.post('/logout', logout)

export default router;