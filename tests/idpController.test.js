import assert from 'node:assert';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../app.js';

describe('IDP Controller', () => {
    describe('POST /api/idp/refresh', () => {
        it('returns 422 when refreshToken is missing', async () => {
            const res = await request(app)
                .post('/api/idp/refresh')
                .send({});

            assert.strictEqual(res.statusCode, 422);
            assert.strictEqual(res.body.error, 'refreshToken field is required');
        });

        it('returns 500 for malformed refresh token', async () => {
            const res = await request(app)
                .post('/api/idp/refresh')
                .send({ refreshToken: 'not-a-valid-jwt' });

            assert.strictEqual(res.statusCode, 500);
            assert.ok(res.body.error);
        });

        it('returns 500 for expired refresh token', async () => {
            const token = jwt.sign(
                { sub: 'expired@example.org', aud: 'OpenCES' },
                process.env.JWT_REFRESH_SECRET_KEY,
                {
                    algorithm: 'HS256',
                    expiresIn: '-1s',
                    issuer: process.env.TRUSTED_ISSUER,
                }
            );

            const res = await request(app)
                .post('/api/idp/refresh')
                .send({ refreshToken: token });

            assert.strictEqual(res.statusCode, 500);
            assert.ok(res.body.error);
        });
    });

    describe('POST /api/idp/logout', () => {
        it('returns 200 with token provided', async () => {
            const res = await request(app)
                .post('/api/idp/logout')
                .send({ token: 'any-value' });

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.text, 'Logout');
        });

        it('returns 200 without token provided (current behavior)', async () => {
            const res = await request(app)
                .post('/api/idp/logout')
                .send({});

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.text, 'Logout');
        });
    });
});


