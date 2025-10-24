import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";

//Generate Access Token
export function getAccessToken(user) {

    const now = Math.floor(Date.now() / 1000);
    const exp = now + parseInt(process.env.ACCESS_TOKEN_DURATION);

    // JWT Access Token
    const token = jwt.sign({
        sub: user.email,
        jti: uuidv4(),
        role: user.role,
        aud: "OpenCES",
        exp: exp,
    }, process.env.JWT_ACCESS_SECRET_KEY, {
        algorithm: "HS256",
        issuer: process.env.TRUSTED_ISSUER
    });
    
    return token;
}

export function getAccessTokenByEmailAndRole(email, role) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + parseInt(process.env.ACCESS_TOKEN_DURATION);

    // JWT Access Token
    const token = jwt.sign({
        sub: email,
        jti: uuidv4(),
        role: role,
        aud: "OpenCES",
        exp: exp,
    }, process.env.JWT_ACCESS_SECRET_KEY, {
        algorithm: "HS256",
        issuer: process.env.TRUSTED_ISSUER
    });
    return token;
}

export function getRefreshToken(user) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + parseInt(process.env.REFRESH_TOKEN_DURATION);

    const token = jwt.sign({
        sub: user.email,
        jti: uuidv4(),
        aud: "OpenCES",
        exp: exp,
    }, process.env.JWT_REFRESH_SECRET_KEY, {
        algorithm: "HS256",
        issuer: process.env.TRUSTED_ISSUER
    });
    return token;
}