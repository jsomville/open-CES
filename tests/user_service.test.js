import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

import {
    getUserList,
    createUser,
    updateUser,
    removeUser,
    getUserByEmail,
    getUserById,
    getUserByPhone,
    getLoginUserByEmail,
    setActiveUserById,
    setUserAdminById,
    updateLastLogin,
} from '../services/user_service.js';
import { getUserAccounts } from '../services/account_service.js';
import { getCurrencyBySymbol } from '../services/currency_service.js';
import config from './config.test.js';

const prisma = new PrismaClient();

describe('Test User_service', () => {
    let currency;
    let user1; // created via addUser
    let user2Email = 'user_svc2@example.org'; 

    const user1Payload = {
        email: 'user_svc1@example.org',
        phone: '1000000011',
        password: 'Abcd1234!',
    };

    before(async () => {
        // Use test currency from config
        currency = await getCurrencyBySymbol(config.testCurrency);
        if (!currency) {
            throw new Error(`Test currency ${config.testCurrency} not found. Please ensure database is initialized.`);
        }

        // ensure clean slate for test users
        await prisma.user.deleteMany({ where: { email: { in: [user1Payload.email, user2Email] } } });

        const hashedPassword = await argon2.hash(user1Payload.password);
        user1 = await createUser(user1Payload.email, user1Payload.phone, hashedPassword, 'user', 'First', 'Last');
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

    it('setActiveUserById updates isActive flag', async () => {
        await setActiveUserById(user1.id);

        const updated = await getUserById(user1.id);
        assert.strictEqual(updated.isActive, true);
    });

    it('getUserList returns all users without passwordHash', async () => {
        const users = await getUserList();
        assert.ok(Array.isArray(users));
        assert.ok(users.length > 0);
        
        // Check no user has passwordHash
        users.forEach(user => {
            assert.ok(!('passwordHash' in user));
        });
        
        // Should find our test user
        const foundUser = users.find(u => u.email === user1Payload.email);
        assert.ok(foundUser);
    });

    it('getUserByPhone returns user by phone number', async () => {
        const user = await getUserByPhone(user1Payload.phone);
        assert.ok(user);
        assert.strictEqual(user.email, user1Payload.email);
        assert.ok(!('passwordHash' in user));
    });

    it('getUserByPhone returns null for non-existent phone', async () => {
        const user = await getUserByPhone('9999999999');
        assert.strictEqual(user, null);
    });

    it('getLoginUserByEmail returns user WITH passwordHash', async () => {
        const user = await getLoginUserByEmail(user1Payload.email);
        assert.ok(user);
        assert.strictEqual(user.email, user1Payload.email);
        assert.ok(user.passwordHash); // Should have password hash
    });

    it('updateUser updates user data', async () => {
        const updated = await updateUser(user1.id, { 
            firstname: 'UpdatedFirst',
            lastname: 'UpdatedLast'
        });
        
        assert.ok(updated);
        assert.strictEqual(updated.firstname, 'UpdatedFirst');
        assert.strictEqual(updated.lastname, 'UpdatedLast');
        assert.ok(!('passwordHash' in updated));
    });

    it('setUserAdminById changes user role to admin', async () => {
        await setUserAdminById(user1.id);
        
        const updated = await getUserById(user1.id);
        assert.strictEqual(updated.role, 'admin');
    });

    it('updateLastLogin sets lastLoginAt timestamp', async () => {
        const before = await getUserById(user1.id);
        const beforeTime = before.lastLoginAt;
        
        // Wait a bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
        
        await updateLastLogin(user1.id);
        
        const after = await getUserById(user1.id);
        assert.ok(after.lastLoginAt);
        
        // Should be more recent than before
        if (beforeTime) {
            assert.ok(new Date(after.lastLoginAt) > new Date(beforeTime));
        }
    });

    it('getUserAccounts return empty for user without account', async () => {
        const accountsById = await getUserAccounts(user1.id);
        assert.ok(Array.isArray(accountsById));
        assert.strictEqual(accountsById.length, 0);
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
        const byPhone = await getUserByPhone('0000000000');
        const byLogin = await getLoginUserByEmail('does-not-exist@example.org');
        
        assert.strictEqual(byEmail, null);
        assert.strictEqual(byId, null);
        assert.strictEqual(byPhone, null);
        assert.strictEqual(byLogin, null);
    });
});


