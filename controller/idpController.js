import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

const prisma = new PrismaClient();

import { getAccessToken, getRefreshToken } from "../services/auth_service.js";

// @desc Login
// @toute POST /api/idp/login
export const login = async (req, res, next) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        //Username is required
        if (!username) {
            return res.status(422).json({ error: "username field is required" });
        }

        //Password is required
        if (!password) {
            return res.status(422).json({ error: "password field is required" });
        }

        //Get User if exists
        const user = await prisma.user.findUnique({ where: { email: username } })
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        // Check user is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Check user is validated
        if (!user.isEmailValidated || !user.isPhoneValidated) {
            return res.status(403).json({ error: "Forbidden" });
        }

        //Verify User Password
        const isPasswordMatch = await argon2.verify(user.passwordHash, password)
        if (!isPasswordMatch) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        // Get Access Token
        const accessToken = getAccessToken(user);

        //Get Refresh Token
        const refreshToken = getRefreshToken(user);

        //Add refresh to cookie ?!?

        //Add REFRESH Token to cache

        res.status(200).json({ accessToken, refreshToken })
    }
    catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
}

function verifyTokenAsync(token, secret) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}

// @desc Refresh Token
// @toute POST /api/idp/refresh
export const refresh = async (req, res, next) => {
    try {
        //Refresh Token is required
        const token = req.body.refreshToken;
        if (!token) {
            return res.status(422).json({ error: "refreshToken field is required" });
        }

        //Verify Token
        const decoded = await verifyTokenAsync(token, process.env.JWT_REFRESH_SECRET_KEY);
        if (!decoded) {
            if (!decoded.iss) {
                return res.status(422).json({ error: "Invalid Refresh Token" });
            }
            console.log("iss")

            //Check Trusted Issuer
            if (decoded.iss = process.env.TRUSTED_ISSUER) {
                return res.status(422).json({ error: "Untrusted Issuer" });
            }

            if (!decoded.sub) {
                return res.status(422).json({ error: "Invalid Refresh Token" });
            }
            // User exists
            const user = await prisma.user.findUnique({ where: { email: decoded.sub } })
            if (!user) {
                return res.status(404).json({ error: "User not found" })
            }

            // Get Access Token
            const accessToken = getAccessToken(user)

            res.status(200).json({ accessToken })
        }
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Logout
// @toute POST /api/idp/logout
export const logout = (req, res, next) => {
    const token = req.body.token;

    //TODO Remove Refresh Token from cache

    res.status(200).send("Logout")
}