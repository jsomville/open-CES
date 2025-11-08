import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

import {
    createUser,
    removeUser,
    getUserByEmail,
    getUserById,
    setActiveUserById,
    setUserIsActiveByEmail,
    deleteUserAndAccount,
    createUserAndAccount,
} from '../services/user_service.js';
import { getAccountByEmailAndCurrencyId, getUserAccounts, getUserAccountsByEmail} from '../services/account_service.js';

const prisma = new PrismaClient();

describe('Test User_service', () => {
    let currency;
    let user1; // created via addUser
    let user2Email = 'user_svc2@example.org'; // created via createUserAndAccount

    const currencyPayload = {
        symbol: 'UTU',
        name: 'UnitTestUserSvc',
        country: 'UT',
        accountMax: 200,
        regionList: '[1000,2000]',
        webSiteURL: 'https://example.com',
        logoURL: 'https://example.com/logo.png',
    };

    const user1Payload = {
        email: 'user_svc1@example.org',
        phone: '1000000011',
        password: 'Abcd1234!',
    };

    before(async () => {
        // ensure clean slate for currency and users
        await prisma.currency.deleteMany({ where: { OR: [{ symbol: currencyPayload.symbol }, { name: currencyPayload.name }] } });
        await prisma.user.deleteMany({ where: { email: { in: [user1Payload.email, user2Email] } } });

        currency = await prisma.currency.create({ data: currencyPayload });

        user1 = await createUser(user1Payload.email, user1Payload.phone, user1Payload.password);
    });

    after(async () => {
        // delete test users (if still present)
        const u1 = await prisma.user.findUnique({ where: { email: user1Payload.email } });
        if (u1) {
            await prisma.user.delete({ where: { id: u1.id } });
        }
        const u2 = await prisma.user.findUnique({ where: { email: user2Email } });
        if (u2) {
            await prisma.user.delete({ where: { id: u2.id } });
        }

        // delete test currency
        if (currency) {
            await prisma.currency.delete({ where: { id: currency.id } });
        }
    });

    it('addUser creates a user and getters return it (without passwordHash)', async () => {
        assert.ok(user1);
        assert.ok(user1.id);
        assert.strictEqual(user1.email, user1Payload.email);
        assert.ok(!('passwordHash' in user1));

        const byEmail = await getUserByEmail(user1Payload.email);
        assert.ok(byEmail);
        assert.strictEqual(byEmail.id, user1.id);
        assert.ok(!('passwordHash' in byEmail));

        const byId = await getUserById(user1.id);
        assert.ok(byId);
        assert.strictEqual(byId.email, user1Payload.email);
        assert.ok(!('passwordHash' in byId));
    });

    it('setActiveUser update flags', async () => {
        await setActiveUserById(user1.id);

        const updated = await getUserById(user1.id);
        assert.strictEqual(updated.isActive, true);
    });

    it('setUserIsActiveByEmail returns safe user and sets isActive', async () => {
        const safe = await setUserIsActiveByEmail(user1Payload.email);
        assert.ok(safe);
        assert.strictEqual(safe.isActive, true);
        assert.ok(!('passwordHash' in safe));
    });

    it('getUserAccounts and getUserAccountsByEmail return empty for user without account', async () => {
        const accountsById = await getUserAccounts(user1.id);
        const accountsByEmail = await getUserAccountsByEmail(user1Payload.email);
        assert.ok(Array.isArray(accountsById));
        assert.ok(Array.isArray(accountsByEmail));
        assert.strictEqual(accountsById.length, 0);
        assert.strictEqual(accountsByEmail.length, 0);
    });

    it('createUserAndAccount creates user with an account for given currency', async () => {
        await createUserAndAccount(user2Email, 'Abcd1234!', '1000000012', 'user', currency.id);

        const u2 = await getUserByEmail(user2Email);
        assert.ok(u2);

        const accountsById = await getUserAccounts(u2.id);
        assert.strictEqual(accountsById.length, 1);
        assert.strictEqual(accountsById[0].currencyId, currency.id);

        const accountsByEmail = await getUserAccountsByEmail(user2Email);
        assert.strictEqual(accountsByEmail.length, 1);

        const accountByEmailAndCurrency = await getAccountByEmailAndCurrencyId(user2Email, currency.id);
        assert.ok(accountByEmailAndCurrency);
        assert.strictEqual(accountByEmailAndCurrency.currencyId, currency.id);
    });

    it('deleteUserAndAccount removes user and their accounts', async () => {
        // ensure user2 exists
        const u2 = await getUserByEmail(user2Email);
        assert.ok(u2);

        await deleteUserAndAccount(user2Email);

        const afterUser = await getUserByEmail(user2Email);
        assert.strictEqual(afterUser, null);

        const accounts = await getUserAccountsByEmail(user2Email);
        assert.strictEqual(accounts, null);
    });

    it('removeUser deletes user by id', async () => {
        const before = await getUserByEmail(user1Payload.email);
        assert.ok(before);
        await removeUser(before.id);
        const after = await getUserByEmail(user1Payload.email);
        assert.strictEqual(after, null);
    });

    it('getters return null when user not found', async () => {
        const byEmail = await getUserByEmail('does-not-exist@example.org');
        const byId = await getUserById(99999999);
        assert.strictEqual(byEmail, null);
        assert.strictEqual(byId, null);
    });
});


