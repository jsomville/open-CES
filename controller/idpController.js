import jwt from "jsonwebtoken";
import argon2 from 'argon2';


import { getAccessToken, getRefreshToken } from "../services/auth_service.js";
import redisHelper from '../utils/redisHelper.js'
import { getUserByEmail, getLoginUserByEmail } from "../services/user_service.js";

// @desc Login
// @toute POST /api/idp/login
export const login = async (req, res, next) => {
    try {
        const username = req.validatedBody.username;
        const password = req.validatedBody.password;

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
            return res.status(401).json({ error: "Invalid username or password" })
        }


        // TODO #68 : Update Last Login


        // Get Access Token
        const accessToken = getAccessToken(user);

        // Update Access Token in cache
        const at_key = "AccessToken:" + user.email;
        await redisHelper.set(at_key, accessToken, process.env.ACCESS_TOKEN_DURATION);

        //Get Refresh Token
        const refreshToken = getRefreshToken(user);

        //Add Refresh Token to cache
        const rt_key = "RefreshToken:" + user.email;
        await redisHelper.set(rt_key, refreshToken, process.env.REFRESH_TOKEN_DURATION);

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
        const token = req.validatedBody.refreshToken;

        //Verify Token
        const decoded = await verifyTokenAsync(token, process.env.JWT_REFRESH_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid Refresh Token" })
        }

        // Check if refresh token is in cache
        const rt_key = "RefreshToken:" + decoded.sub;
        const cachedRT =  await redisHelper.get(rt_key);
        if (!cachedRT || cachedRT !== token) {
            return res.status(401).json({ error: "Invalid Refresh Token 2" })
        }

        // Validate User
        const user = await getUserByEmail(decoded.sub);
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // Get New Access Token
        const accessToken = getAccessToken(user)

        // Update Access Token in cache
        const at_key = "AccessToken:" + user.email;
        await redisHelper.set(at_key, accessToken, process.env.ACCESS_TOKEN_DURATION);

        res.status(200).json({ accessToken })
        
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Logout
// @toute POST /api/idp/logout
export const logout = async (req, res, next) => {
    try{
        const decodedToken = req.decodedToken;

        const email = decodedToken.sub;

        //Remove Access Token
        const at_key = "AccessToken:" + email;
        await redisHelper.del(at_key);

        //Remove Refresh Token
        const rt_key = "RefreshToken:" + email;
        await redisHelper.del(rt_key);

        res.status(200).json({ message: "Logout successful" })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message })
    }
}