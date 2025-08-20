import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

describe('Test auth middleware', () => {
    let app;
    let secret;
    let authenticateToken;
    let previousSecret;

    before(async () => {
        // set the secret BEFORE importing the middleware (it is read at module init)
        previousSecret = process.env.JWT_ACCESS_SECRET_KEY;
        secret = 'test-secret-key';
        process.env.JWT_ACCESS_SECRET_KEY = secret;

        ({ authenticateToken } = await import('../middleware/auth.js'));

        app = express();
        app.get('/protected', authenticateToken, (req, res) => {
            res.status(200).json({ ok: true, user: req.user });
        });
    });

    after(async () => {
        process.env.JWT_ACCESS_SECRET_KEY = previousSecret;
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/protected');
        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res.body.message, 'Authorization Header is missing');
    });

    it('returns 401 for invalid scheme', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Token abc');
        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res.body.message, 'Invalid token');
    });

    it('returns 401 when Bearer token is missing', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer');
        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res.body.message, 'Invalid token');
    });

    it('returns 403 when token is invalid', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer not-a-valid.jwt');
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.message, 'Invalid token');
    });

    it('allows access with valid token and attaches user to req', async () => {
        const token = jwt.sign({ sub: 'user@example.org', role: 'user', aud: 'OpenCES' }, secret, {
            algorithm: 'HS256',
            issuer: 'Open-CES',
            expiresIn: '5m',
        });

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.ok, true);
        assert.ok(res.body.user);
        assert.strictEqual(res.body.user.sub, 'user@example.org');
        assert.strictEqual(res.body.user.role, 'user');
    });
});


