import express from 'express';

import {login, refresh, logout} from '../controller/idpController.js'

const router = express.Router();

// Login
router.post('/login', login)

//Refresh
router.post('/refresh', refresh)

//Logout
router.post('/logout', logout)

export default router;