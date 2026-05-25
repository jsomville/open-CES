import assert from 'node:assert';
import request from 'supertest';

import { prisma } from '../utils/prisma.ts';
import { app } from '../app.js';
import { createValidationChallenge } from '../services/validation_challenge_service.ts';

describe('Register Route', () => {
    const emailPrefix = 'register.route.test+';
    let suffixCounter = 0;

    const buildIdentity = () => {
        suffixCounter += 1;
        const suffix = `${Date.now()}-${suffixCounter}`;
        return {
            email: `${emailPrefix}${suffix}@opences.org`,
            phone: `+329990${String(suffixCounter).padStart(5, '0')}`,
        };
    };

    const cleanup = async () => {
        await prisma.validationChallenge.deleteMany({
            where: {
                email: {
                    startsWith: emailPrefix,
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: {
                    startsWith: emailPrefix,
                },
            },
        });
    };

    beforeEach(async () => {
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    it('Register - creates a pending user and challenges', async () => {
        const identity = buildIdentity();
        const payload = {
            firstname: 'John',
            lastname: 'Doe',
            email: identity.email,
            phone: identity.phone,
            password: 'TestABC123!',
        };

        const res = await request(app).post('/api/register').send(payload);

        assert.equal(res.statusCode, 200);
        assert.equal(
            res.body.message,
            'User registration request created, please check your email and SMS for validation codes.',
        );

        const user = await prisma.user.findUnique({ where: { email: identity.email } });
        assert.ok(user);
        assert.equal(user.status, 'PENDING');
        assert.equal(user.emailVerifiedAt, null);
        assert.equal(user.phoneVerifiedAt, null);

        const challenges = await prisma.validationChallenge.findMany({
            where: { email: identity.email },
        });
        assert.equal(challenges.length, 2);
        assert.ok(challenges.some((challenge) => challenge.channel === 'email'));
        assert.ok(challenges.some((challenge) => challenge.channel === 'sms'));
    });

    it('Register - returns 400 when firstname is missing', async () => {
        const identity = buildIdentity();
        const payload = {
            lastname: 'Doe',
            email: identity.email,
            phone: identity.phone,
            password: 'TestABC123!',
        };

        const res = await request(app).post('/api/register').send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Validation failed');
    });

    it('Register - returns 409 when pending user with same email exists', async () => {
        const identity = buildIdentity();

        await prisma.user.create({
            data: {
                firstname: 'Jane',
                lastname: 'Doe',
                email: identity.email,
                phone: identity.phone,
                passwordHash: 'not-a-real-hash',
                role: 'user',
                status: 'PENDING',
            },
        });

        const res = await request(app).post('/api/register').send({
            firstname: 'John',
            lastname: 'Doe',
            email: identity.email,
            phone: buildIdentity().phone,
            password: 'TestABC123!',
        });

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, 'User with this email already exists');
    });

    it('Register - returns 409 when pending user with same phone exists', async () => {
        const firstIdentity = buildIdentity();
        const secondIdentity = buildIdentity();

        await prisma.user.create({
            data: {
                firstname: 'Jane',
                lastname: 'Doe',
                email: firstIdentity.email,
                phone: firstIdentity.phone,
                passwordHash: 'not-a-real-hash',
                role: 'user',
                status: 'PENDING',
            },
        });

        const res = await request(app).post('/api/register').send({
            firstname: 'John',
            lastname: 'Doe',
            email: secondIdentity.email,
            phone: firstIdentity.phone,
            password: 'TestABC123!',
        });

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, 'User with this phone number already exists');
    });

    it('Challenge - validates one channel and keeps user pending', async () => {
        const identity = buildIdentity();
        await prisma.user.create({
            data: {
                firstname: 'John',
                lastname: 'Doe',
                email: identity.email,
                phone: identity.phone,
                passwordHash: 'not-a-real-hash',
                role: 'user',
                status: 'PENDING',
            },
        });

        await createValidationChallenge('email', identity.email, '123456', new Date(Date.now() + 60_000));

        const res = await request(app).post('/api/register/challenge').send({
            email: identity.email,
            channel: 'email',
            code: '123456',
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, 'Challenge validated, waiting for other channel');

        const user = await prisma.user.findUnique({ where: { email: identity.email } });
        assert.ok(user);
        assert.ok(user.emailVerifiedAt instanceof Date);
        assert.equal(user.phoneVerifiedAt, null);
        assert.equal(user.status, 'PENDING');
    });

    it('Challenge - activates user after both channels are verified', async () => {
        const identity = buildIdentity();

        await prisma.user.create({
            data: {
                firstname: 'John',
                lastname: 'Doe',
                email: identity.email,
                phone: identity.phone,
                passwordHash: 'not-a-real-hash',
                role: 'user',
                status: 'PENDING',
                emailVerifiedAt: new Date(),
            },
        });

        await createValidationChallenge('sms', identity.email, '654321', new Date(Date.now() + 60_000));

        const res = await request(app).post('/api/register/challenge').send({
            email: identity.email,
            channel: 'sms',
            code: '654321',
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, 'Registration validated successfully');

        const user = await prisma.user.findUnique({ where: { email: identity.email } });
        assert.ok(user);
        assert.ok(user.phoneVerifiedAt instanceof Date);
        assert.equal(user.status, 'ACTIVE');
    });

    it('Challenge - returns 404 for invalid challenge', async () => {
        const identity = buildIdentity();

        await prisma.user.create({
            data: {
                firstname: 'John',
                lastname: 'Doe',
                email: identity.email,
                phone: identity.phone,
                passwordHash: 'not-a-real-hash',
                role: 'user',
                status: 'PENDING',
            },
        });

        const res = await request(app).post('/api/register/challenge').send({
            email: identity.email,
            channel: 'sms',
            code: '999999',
        });

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, 'Invalid Challenge');
    });

    it('Challenge - returns 400 when code format is invalid', async () => {
        const identity = buildIdentity();
        const res = await request(app).post('/api/register/challenge').send({
            email: identity.email,
            channel: 'email',
            code: '12345',
        });

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Validation failed');
    });
});
