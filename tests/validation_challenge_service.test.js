import assert from 'node:assert';

import { prisma } from '../utils/prisma.ts';
import {
    generateCode,
    createValidationChallenge,
    getValidationChallengeByEmailAndChannel,
    consumeValidationChallenge,
    incrementValidationChallengeAttemptCount,
    deleteValidationChallengesByEmailAndChannel,
    deleteExpiredValidationChallenges,
    validateCode,
} from '../services/validation_challenge_service.ts';

describe('Validation Challenge Service Tests', () => {
    const emailPrefix = 'validation.service.test+';

    const buildEmail = (suffix) => `${emailPrefix}${suffix}@opences.org`;

    beforeEach(async () => {
        await prisma.validationChallenge.deleteMany({
            where: {
                email: {
                    startsWith: emailPrefix,
                },
            },
        });
    });

    afterEach(async () => {
        await prisma.validationChallenge.deleteMany({
            where: {
                email: {
                    startsWith: emailPrefix,
                },
            },
        });
    });

    it('generateCode returns a 6-digit numeric code', async () => {
        const code = await generateCode();

        assert.equal(typeof code, 'string');
        assert.match(code, /^\d{6}$/);
    });

    it('createValidationChallenge creates a challenge with defaults', async () => {
        const email = buildEmail('create-defaults');
        const expiresAt = new Date(Date.now() + 60_000);

        const challenge = await createValidationChallenge('email', email, '123456', expiresAt);

        assert.ok(challenge.id > 0);
        assert.equal(challenge.channel, 'email');
        assert.equal(challenge.email, email);
        assert.equal(challenge.code, '123456');
        assert.equal(challenge.attemptCount, 0);
        assert.equal(challenge.consumedAt, null);
    });

    it('getValidationChallengeByEmailAndChannel returns latest active challenge', async () => {
        const email = buildEmail('latest-active');
        const channel = 'email';
        const expiresAt = new Date(Date.now() + 60_000);

        const expired = await createValidationChallenge(channel, email, '000001', new Date(Date.now() - 60_000));
        const consumed = await createValidationChallenge(channel, email, '000002', expiresAt);
        await consumeValidationChallenge(consumed.id);

        const oldActive = await createValidationChallenge(channel, email, '111111', expiresAt);
        const latestActive = await createValidationChallenge(channel, email, '222222', expiresAt);

        // Ensure deterministic ordering by forcing distinct creation timestamps.
        await prisma.validationChallenge.update({
            where: { id: oldActive.id },
            data: { createdAt: new Date(Date.now() - 10_000) },
        });
        await prisma.validationChallenge.update({
            where: { id: latestActive.id },
            data: { createdAt: new Date() },
        });

        const found = await getValidationChallengeByEmailAndChannel(email, channel);

        assert.ok(found);
        assert.equal(found.id, latestActive.id);
        assert.notEqual(found.id, expired.id);
    });

    it('consumeValidationChallenge marks challenge as consumed', async () => {
        const email = buildEmail('consume');
        const challenge = await createValidationChallenge('email', email, '111111', new Date(Date.now() + 60_000));

        await consumeValidationChallenge(challenge.id);

        const stored = await prisma.validationChallenge.findUnique({ where: { id: challenge.id } });
        assert.ok(stored);
        assert.ok(stored.consumedAt instanceof Date);
    });

    it('incrementValidationChallengeAttemptCount increments attempt count', async () => {
        const email = buildEmail('increment-attempt');
        const challenge = await createValidationChallenge('email', email, '111111', new Date(Date.now() + 60_000));

        await incrementValidationChallengeAttemptCount(challenge.id);
        await incrementValidationChallengeAttemptCount(challenge.id);

        const stored = await prisma.validationChallenge.findUnique({ where: { id: challenge.id } });
        assert.ok(stored);
        assert.equal(stored.attemptCount, 2);
    });

    it('deleteValidationChallengesByEmailAndChannel deletes only matching channel and email', async () => {
        const email = buildEmail('delete-by-email-channel');
        const otherEmail = buildEmail('delete-other');

        await createValidationChallenge('email', email, '111111', new Date(Date.now() + 60_000));
        await createValidationChallenge('sms', email, '222222', new Date(Date.now() + 60_000));
        await createValidationChallenge('email', otherEmail, '333333', new Date(Date.now() + 60_000));

        await deleteValidationChallengesByEmailAndChannel(email, 'email');

        const remainingForEmailChannel = await prisma.validationChallenge.count({
            where: { email, channel: 'email' },
        });
        const remainingSmsSameEmail = await prisma.validationChallenge.count({
            where: { email, channel: 'sms' },
        });
        const remainingOtherEmail = await prisma.validationChallenge.count({
            where: { email: otherEmail, channel: 'email' },
        });

        assert.equal(remainingForEmailChannel, 0);
        assert.equal(remainingSmsSameEmail, 1);
        assert.equal(remainingOtherEmail, 1);
    });

    it('deleteExpiredValidationChallenges removes expired challenges only', async () => {
        const email = buildEmail('delete-expired');

        await createValidationChallenge('email', email, '111111', new Date(Date.now() - 60_000));
        const active = await createValidationChallenge('email', email, '222222', new Date(Date.now() + 60_000));

        await deleteExpiredValidationChallenges();

        const expiredCount = await prisma.validationChallenge.count({
            where: { email, code: '111111' },
        });
        const activeStored = await prisma.validationChallenge.findUnique({ where: { id: active.id } });

        assert.equal(expiredCount, 0);
        assert.ok(activeStored);
    });

    it('validateCode returns true and consumes challenge when code matches', async () => {
        const email = buildEmail('validate-success');
        const code = '654321';
        const created = await createValidationChallenge('email', email, code, new Date(Date.now() + 60_000));

        const isValid = await validateCode(email, 'email', code);

        assert.equal(isValid, true);

        const stored = await prisma.validationChallenge.findUnique({ where: { id: created.id } });
        assert.ok(stored);
        assert.ok(stored.consumedAt instanceof Date);
        assert.equal(stored.attemptCount, 0);
    });

    it('validateCode returns false and increments attempt count when code does not match', async () => {
        const email = buildEmail('validate-failure');
        const created = await createValidationChallenge('email', email, '111111', new Date(Date.now() + 60_000));

        const isValid = await validateCode(email, 'email', '999999');

        assert.equal(isValid, false);

        const stored = await prisma.validationChallenge.findUnique({ where: { id: created.id } });
        assert.ok(stored);
        assert.equal(stored.consumedAt, null);
        assert.equal(stored.attemptCount, 1);
    });

    it('validateCode returns false when no active challenge is found', async () => {
        const email = buildEmail('validate-no-challenge');

        const isValid = await validateCode(email, 'email', '123456');

        assert.equal(isValid, false);
    });
});
