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
        webSiteURL: "https://www.example.com",
        newAccountWizardURL: "https://www.example.com/",
        topOffWizardURL: "https://www.example.com/",
        androidAppURL: "https://www.example.com/",
        iphoneAppURL: "https://www.example.com/",
        androidAppLatestVersion: "1.2.3",
        iphoneAppLatestVersion: "1.2.3",
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
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
        assert.strictEqual(found.accountMax, payload.accountMax);
        assert.strictEqual(found.regionList, payload.regionList);
        assert.strictEqual(found.webSiteURL, payload.webSiteURL);
        assert.strictEqual(found.newAccountWizardURL, payload.newAccountWizardURL);
        assert.strictEqual(found.topOffWizardURL, payload.topOffWizardURL);
        assert.strictEqual(found.androidAppURL, payload.androidAppURL);
        assert.strictEqual(found.iphoneAppURL, payload.iphoneAppURL);
        assert.strictEqual(found.androidAppLatestVersion, payload.androidAppLatestVersion);
        assert.strictEqual(found.iphoneAppLatestVersion, payload.iphoneAppLatestVersion);
        assert.ok(found.createdAt);
        assert.ok(found.updatedAt);
        assert.ok(found.accountNextNumber);
    });

    it('getCurrencyByName returns the currency', async () => {
        const found = await getCurrencyByName(payload.name);
        assert.ok(found);
        assert.strictEqual(found.id, created.id);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
        assert.strictEqual(found.accountMax, payload.accountMax);
        assert.strictEqual(found.regionList, payload.regionList);
        assert.strictEqual(found.webSiteURL, payload.webSiteURL);
        assert.strictEqual(found.newAccountWizardURL, payload.newAccountWizardURL);
        assert.strictEqual(found.topOffWizardURL, payload.topOffWizardURL);
        assert.strictEqual(found.androidAppURL, payload.androidAppURL);
        assert.strictEqual(found.iphoneAppURL, payload.iphoneAppURL);
        assert.strictEqual(found.androidAppLatestVersion, payload.androidAppLatestVersion);
        assert.strictEqual(found.iphoneAppLatestVersion, payload.iphoneAppLatestVersion);
        assert.ok(found.createdAt);
        assert.ok(found.updatedAt);
        assert.ok(found.accountNextNumber);
    });

    it('getCurrencyById returns the currency', async () => {
        const found = await getCurrencyById(created.id);
        assert.ok(found);
        assert.strictEqual(found.id, created.id);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
        assert.strictEqual(found.accountMax, payload.accountMax);
        assert.strictEqual(found.regionList, payload.regionList);
        assert.strictEqual(found.webSiteURL, payload.webSiteURL);
        assert.strictEqual(found.newAccountWizardURL, payload.newAccountWizardURL);
        assert.strictEqual(found.topOffWizardURL, payload.topOffWizardURL);
        assert.strictEqual(found.androidAppURL, payload.androidAppURL);
        assert.strictEqual(found.iphoneAppURL, payload.iphoneAppURL);
        assert.strictEqual(found.androidAppLatestVersion, payload.androidAppLatestVersion);
        assert.strictEqual(found.iphoneAppLatestVersion, payload.iphoneAppLatestVersion);
        assert.ok(found.createdAt);
        assert.ok(found.updatedAt);
        assert.ok(found.accountNextNumber);
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


