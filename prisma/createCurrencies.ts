import { connectRedis, redisClient } from '../utils/redisClient.ts';

import { createCurrency } from '../services/currency_service.ts';
import { createAccount, createCurrencyMainAccount } from '../services/account_service.ts';
import { AccountType } from '../utils/accountUtil.ts';

// to run : npx tsx --env-file=.env prisma/createCurrencies.ts

const create_zinne = async () => {
    try{
        const data = {
            symbol: "Z",
            name: "Zinne",
            country: "BE",
            logoURL: "lazinne.png",
            webSiteURL: "https://zinne.be",
            regionList: '[1000, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 1083, 1090, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210, 1212]',
            newAccountWizardURL: "https:/example.com",
            topOffWizardURL: "https:/example.com",
            androidAppURL: "https://example.com",
            iphoneAppURL: "https://example.com",
            androidAppLatestVersion: "1.0.0",
            iphoneAppLatestVersion: "1.0.0",
        }

        const currency = await createCurrency(data);

        await createCurrencyMainAccount(currency);

        console.log("Currency created: " + currency.symbol);
    }
    catch (error) {
        console.error("Error creating currency: ", error);
    }
}

const create_brawette = async () => {
    try{
        const data = {
            symbol: "B",
            name: "Brawette",
            country: "BE",
            logoURL: "labrawette.png",
            webSiteURL: "https://www.labrawette.be/",
            newAccountWizardURL: "https:/example.com",
            topOffWizardURL: "https:/example.com",
            androidAppURL: "https://example.com",
            iphoneAppURL: "https://example.com",
            androidAppLatestVersion: "1.0.0",
            iphoneAppLatestVersion: "1.0.0",
        }

        const currency = await createCurrency(data);

        await createCurrencyMainAccount(currency);

        console.log("Currency created: " + currency.symbol);
    }
    catch (error) {
        console.error("Error creating currency: ", error);
    }
}

const create_valheureux = async () => {
    try{
        const data = {
            symbol: "V",
            name: "Valheureux",
            country: "BE",
            logoURL: "levalheureux.png",
            webSiteURL: "https://www.valheureux.be/",
            newAccountWizardURL: "https:/example.com",
            topOffWizardURL: "https:/example.com",
            androidAppURL: "https://example.com",
            iphoneAppURL: "https://example.com",
            androidAppLatestVersion: "1.0.0",
            iphoneAppLatestVersion: "1.0.0",
        }

        const currency = await createCurrency(data);

        await createCurrencyMainAccount(currency);

        console.log("Currency created: " + currency.symbol);
    }
    catch (error) {
        console.error("Error creating currency: ", error);
    }
}

// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Create Currencies...")

    await connectRedis();

    await create_zinne();

    await create_brawette();

    await create_valheureux();

    await redisClient.quit();

    console.log("Currencies Initialized");
}