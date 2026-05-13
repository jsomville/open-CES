import jwt from "jsonwebtoken";
import argon2 from 'argon2';
import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';

import { getAccessToken, getRefreshToken } from "../services/auth_service.ts";
import redisHelper from '../utils/redisHelper.ts'
import { getUserByEmail, getLoginUserByEmail, updateLastLogin } from "../services/user_service.ts";

const MAX_LOGIN_ATTEMPTS = (process.env.MAX_LOGIN_ATTEMPTS || 5) as number;
const ACCOUNT_LOCKOUT_DURATION = (process.env.ACCOUNT_LOCKOUT_DURATION || 15 * 60) as number; // 15 minutes in seconds
const ACCESS_TOKEN_DURATION = (process.env.ACCESS_TOKEN_DURATION || 15 * 60) as number;
const REFRESH_TOKEN_DURATION = (process.env.REFRESH_TOKEN_DURATION || 60 * 60) as number; // 1 hour in seconds
const JWT_REFRESH_SECRET_KEY = (process.env.JWT_REFRESH_SECRET_KEY || "your_refresh_secret_key") as string

// @desc Login
// @toute POST /api/idp/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const username = req.validatedBody.username as string;
        const password = req.validatedBody.password as string;

        //Check if account is locked
        const lockoutKey = `Lockout:${username}`;
        const isLocked = await redisHelper.get(lockoutKey);
        if (isLocked) {
            return res.status(403).json({ error: "Account is locked due to too many failed login attempts. Please try again later." });
        }

        //Get User if exists
        const user = await getLoginUserByEmail(username);
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        // Check user is active
        if (!user.isActive) {
            return res.status(403).json({ error: "User is not active" });
        }

        //Verify User Password
        const isPasswordMatch = await argon2.verify(user.passwordHash, password)
        if (!isPasswordMatch) {
            // Increase failed login attempt counter
            const count = await redisHelper.incr(`LoginAttempts:${user.email}`);


            const attempts = (await redisHelper.get(`LoginAttempts:${user.email}`) || 0) as number;
            if (attempts > MAX_LOGIN_ATTEMPTS) {
                // Lock user account
                await redisHelper.set(`Lockout:${user.email}`, 'locked', ACCOUNT_LOCKOUT_DURATION);
                return res.status(403).json({ error: "Account locked due to too many failed login attempts. Please try again later." });
            }
            

            return res.status(401).json({ error: "Invalid username or password" })
        }

        //Update Last Login
        await updateLastLogin(user.id);

        //reset login attempts on successful login
        const attemptsKey = `LoginAttempts:${user.email}`;
        await redisHelper.del(attemptsKey);

        // Get Access Token
        const accessToken = getAccessToken(user);

        // Update Access Token in cache
        const at_key = "AccessToken:" + user.email;
        await redisHelper.set(at_key, accessToken, ACCESS_TOKEN_DURATION);

        //Get Refresh Token
        const refreshToken = getRefreshToken(user);

        //Add Refresh Token to cache
        const rt_key = "RefreshToken:" + user.email;
        await redisHelper.set(rt_key, refreshToken, REFRESH_TOKEN_DURATION);

        res.status(200).json({ accessToken, refreshToken })
    }
    catch (error: unknown) {
        console.log("login", error)
        return res.status(500).json({ error: (error as Error).message })
    }
}

function verifyTokenAsync(token: string, secret: string) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}

// @desc Refresh Token
// @toute POST /api/idp/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Refresh Token is required
        const token = req.validatedBody.refreshToken as any;

        //Verify Token
        const decoded = await verifyTokenAsync(token, JWT_REFRESH_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid Refresh Token" })
        }

        // Check if refresh token is in cache
        const email = (decoded as any).sub;
        const rt_key = "RefreshToken:" + email;
        const cachedRT =  await redisHelper.get(rt_key);
        if (!cachedRT || cachedRT !== token) {
            return res.status(401).json({ error: "Invalid Refresh Token 2" })
        }

        // Validate User
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // Get New Access Token
        const accessToken = getAccessToken(user)

        // Update Access Token in cache
        const at_key = "AccessToken:" + user.email;
        await redisHelper.set(at_key, accessToken, ACCESS_TOKEN_DURATION);

        res.status(200).json({ accessToken })
        
    }
    catch (error: unknown) {
        return res.status(500).json({ error: (error as Error).message })
    }
}

// @desc Logout
// @toute POST /api/idp/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try{
        //const decodedToken = req.decodedToken as any;
        //const email = decodedToken.sub;
        
        const email = req.user.sub;

        //Remove Access Token
        const at_key = "AccessToken:" + email;
        await redisHelper.del(at_key);

        //Remove Refresh Token
        const rt_key = "RefreshToken:" + email;
        await redisHelper.del(rt_key);

        res.status(200).json({ message: "Logout successful" })
    }
    catch (error : unknown) {
        console.log(error)
        return res.status(500).json({ error: (error as Error).message })
    }
}