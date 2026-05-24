import assert from 'node:assert';
import { prisma } from '../utils/prisma.ts';
import redisHelper from '../utils/redisHelper.ts';

import { getCurrencyBySymbol, getCurrencyByName, getCurrencyById, getCurrencyList, getSafeCurrencyList, getSimpleCurrencyList, createCurrency, updateCurrency, deleteCurrencyAndRelatedAccountsBySymbol} from '../services/currency_service.ts';

describe('Test Currency_service', () => {
    let createdId;

    const payload = {
        symbol: 'UTS',
        name: 'UnitTestSymbol',
        country: 'UT',
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
        await deleteCurrencyAndRelatedAccountsBySymbol(payload.symbol);

        const created = await prisma.currency.create({ data: payload });
        createdId = created.id;
    });

    after(async () => {
        await deleteCurrencyAndRelatedAccountsBySymbol(payload.symbol);
    });

    it('getCurrencyBySymbol returns the currency', async () => {
        const found = await getCurrencyBySymbol(payload.symbol);
        assert.ok(found);
        assert.strictEqual(found.id, createdId);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
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
        assert.strictEqual(found.id, createdId);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
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
        const found = await getCurrencyById(createdId);
        assert.ok(found);
        assert.strictEqual(found.id, createdId);
        assert.strictEqual(found.name, payload.name);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.country, payload.country);
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

    it('getCurrencyBySymbol - returns null when not found', async () => {
        const currency = await getCurrencyBySymbol('XXX');

        assert.strictEqual(currency, null);
    });

    it('getCurrencyByName - returns null when not found', async () => {
        const currency = await getCurrencyByName('DoesNotExist');
        assert.strictEqual(currency, null);
    });

    it('getCurrencyById - returns null when not found', async () => {
        const currency = await getCurrencyById(99999999);
        assert.strictEqual(currency, null);
    });

    it('getCurrencyList - includes the created currency', async () => {
        await redisHelper.del('currencyList');

        const currencyList = await getCurrencyList();

        assert.ok(Array.isArray(currencyList));

        const found = currencyList.find((currency) => currency.id === createdId);
        assert.ok(found);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.name, payload.name);
    });

    it('getSafeCurrencyList - includes created currency without filtered fields', async () => {
        await redisHelper.del('currencyList');

        const safeCurrencyList = await getSafeCurrencyList();

        assert.ok(Array.isArray(safeCurrencyList));

        const found = safeCurrencyList.find((currency) => currency.id === createdId);
        assert.ok(found);
        assert.strictEqual(found.symbol, payload.symbol);
        assert.strictEqual(found.name, payload.name);

        assert.strictEqual('balance' in found, false);
        assert.strictEqual('createdAt' in found, false);
        assert.strictEqual('updatedAt' in found, false);
        assert.strictEqual('activeAccount' in found, false);
        assert.strictEqual('accountNextNumber' in found, false);
    });

    it('getSimpleCurrencyList - includes created currency without filtered fields', async () => {
        await redisHelper.del('currencyList');

        const simpleCurrencyList = await getSimpleCurrencyList();

        assert.ok(Array.isArray(simpleCurrencyList));

        const found = simpleCurrencyList.find((currency) => currency.symbol === payload.symbol);
        assert.ok(found);
        assert.strictEqual(found.name, payload.name);

        assert.strictEqual('id' in found, false);
        assert.strictEqual('createdAt' in found, false);
        assert.strictEqual('updatedAt' in found, false);
        assert.strictEqual('webSiteURL' in found, false);
        assert.strictEqual('topOffWizardURL' in found, false);
        assert.strictEqual('accountNextNumber' in found, false);
        assert.strictEqual('mainCurrencyAccountNumber' in found, false);
    });

    it('createCurrency - creates and persists a new currency', async () => {
        const createPayload = {
            symbol: `UC99'`,
            name: `UnitCreate-99`,
            country: 'UT',
            regionList: '[3000, 4000]',
            webSiteURL: 'https://www.example.com/create',
            logoURL: 'https://www.example.com/create-logo.png',
            newAccountWizardURL: 'https://www.example.com/new-account',
            topOffWizardURL: 'https://www.example.com/top-off',
            androidAppURL: 'https://www.example.com/android',
            iphoneAppURL: 'https://www.example.com/iphone',
            androidAppLatestVersion: '2.0.0',
            iphoneAppLatestVersion: '2.0.0',
        };

        try {
            await redisHelper.del('currencyList');

            const created = await createCurrency(createPayload);
            assert.ok(created);
            assert.strictEqual(created.symbol, createPayload.symbol);
            assert.strictEqual(created.name, createPayload.name);

            const persisted = await getCurrencyBySymbol(createPayload.symbol);
            assert.ok(persisted);
            assert.strictEqual(persisted.name, createPayload.name);
        } finally {
            await deleteCurrencyAndRelatedAccountsBySymbol(createPayload.symbol);
        }
    });

    it('updateCurrency - modifies and persists currency fields', async () => {
        const createPayload = {
            symbol: 'UMT1',
            name: 'UnitModifyTest-1',
            country: 'UT',
            regionList: '[5000]',
            webSiteURL: 'https://www.example.com/modify-old',
            logoURL: 'https://www.example.com/modify-old-logo.png',
            newAccountWizardURL: 'https://www.example.com/modify-old-new-account',
            topOffWizardURL: 'https://www.example.com/modify-old-top-off',
            androidAppURL: 'https://www.example.com/modify-old-android',
            iphoneAppURL: 'https://www.example.com/modify-old-iphone',
            androidAppLatestVersion: '1.0.0',
            iphoneAppLatestVersion: '1.0.0',
        };

        try {
            await redisHelper.del('currencyList');

            const created = await createCurrency(createPayload);

            const updatePayload = {
                name: 'UnitModifyTest-1-Updated',
                country: 'BE',
                regionList: '[5001, 5002]',
                webSiteURL: 'https://www.example.com/modify-new',
            };

            const updated = await updateCurrency(created.id, updatePayload);

            assert.ok(updated);
            assert.strictEqual(updated.id, created.id);
            assert.strictEqual(updated.name, updatePayload.name);
            assert.strictEqual(updated.country, updatePayload.country);
            assert.strictEqual(updated.regionList, updatePayload.regionList);
            assert.strictEqual(updated.webSiteURL, updatePayload.webSiteURL);

            const persisted = await getCurrencyById(created.id);
            assert.ok(persisted);
            assert.strictEqual(persisted.name, updatePayload.name);
            assert.strictEqual(persisted.country, updatePayload.country);
            assert.strictEqual(persisted.regionList, updatePayload.regionList);
            assert.strictEqual(persisted.webSiteURL, updatePayload.webSiteURL);
        } finally {
            await deleteCurrencyAndRelatedAccountsBySymbol(createPayload.symbol);
        }
    });
});


