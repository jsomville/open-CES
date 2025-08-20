import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

import { getCurrencyBySymbol, getCurrencyByName, getCurrencyById } from '../services/currency_service.js';

const prisma = new PrismaClient();

describe('Test Currency_service', () => {
    let created;

    const payload = {
        symbol: 'UTS',
        name: 'UnitTestSymbol',
        country: 'UT',
        accountMax: 123,
        regionList: '[1000, 2000]',
        webSiteURL: 'https://example.com',
        logoURL: 'https://example.com/logo.png',
    };

    before(async () => {
        // ensure clean slate
        await prisma.currency.deleteMany({ where: { OR: [{ symbol: payload.symbol }, { name: payload.name }] } });
        created = await prisma.currency.create({ data: payload });
    });

    after(async () => {
        if (created) {
            await prisma.currency.delete({ where: { id: created.id } });
        }
    });

    it('getCurrencyBySymbol returns the currency', async () => {
        const found = await getCurrencyBySymbol(payload.symbol);
        assert.ok(found);
        assert.strictEqual(found.id, created.id);
        assert.strictEqual(found.name, payload.name);
    });

    it('getCurrencyByName returns the currency', async () => {
        const found = await getCurrencyByName(payload.name);
        assert.ok(found);
        assert.strictEqual(found.id, created.id);
        assert.strictEqual(found.symbol, payload.symbol);
    });

    it('getCurrencyById returns the currency', async () => {
        const found = await getCurrencyById(created.id);
        assert.ok(found);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
    });

    it('returns null when not found', async () => {
        const bySymbol = await getCurrencyBySymbol('XXX');
        const byName = await getCurrencyByName('DoesNotExist');
        const byId = await getCurrencyById(99999999);
        assert.strictEqual(bySymbol, null);
        assert.strictEqual(byName, null);
        assert.strictEqual(byId, null);
    });
});


