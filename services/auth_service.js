import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";

//Generate Access Token
export function getAccessToken(user) {
    // JWT Access Token
    const token = jwt.sign({
        sub: user.email,
        jti: uuidv4(),
        role: user.role,
        aud: "OpenCES"
    }, process.env.JWT_ACCESS_SECRET_KEY, {
        algorithm: "HS256",
        expiresIn: process.env.ACCESS_TOKEN_DURATION,
        issuer: process.env.TRUSTED_ISSUER
    });
    return token;
}

export function getAccessTokenByEmailAndRole(email, role) {
    // JWT Access Token
    const token = jwt.sign({
        sub: email,
        jti: uuidv4(),
        role: role,
        aud: "OpenCES"
    }, process.env.JWT_ACCESS_SECRET_KEY, {
        algorithm: "HS256",
        expiresIn: process.env.ACCESS_TOKEN_DURATION,
        issuer: process.env.TRUSTED_ISSUER
    });
    return token;
}

export function getRefreshToken(user) {
    const token = jwt.sign({
        sub: user.email,
        jti: uuidv4(),
        aud: "OpenCES"
    }, process.env.JWT_REFRESH_SECRET_KEY, {
        algorithm: "HS256",
        expiresIn: process.env.REFRESH_TOKEN_DURATION,
        issuer: process.env.TRUSTED_ISSUER
    });
    return token;
}