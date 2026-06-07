import argon2 from 'argon2';
import { prisma } from '../utils/prisma.ts';

import { createCurrency, getCurrencyBySymbol } from '../services/currency_service.ts';
import { createPersonalAccount, createCurrencyMainAccount, getAccountByNumber } from '../services/account_service.ts';
import { createUser, setActiveUserById } from '../services/user_service.ts'
import { doFundAccount } from '../services/operation_service.ts';

import { connectRedis, redisClient } from '../utils/redisClient.ts';

const admin_password = process.env.ADMIN_PASSWORD || "1234";
const user_password = process.env.USER_PASSWORD || "1234";

// to run : npx tsx --env-file=.env prisma/initdb.ts

async function createAdminUser() {
    
    const email = "admin@opences.org"

    const passwordHash = await argon2.hash(admin_password);
    await prisma.user.create({
        data: {
            firstname: "admin",
            lastname: "admin",
            email: email,
            phone: "+32488040204",
            passwordHash: passwordHash,
            role: "admin",
            isActive: true,
        }
    });

    console.log("admin user created")
}

async function createCESCurrency(symbol: string) {
    const currencyData = {
        symbol: symbol,
        name: "Open CES",
        country: "EU",
        logoURL: "ces.png",
        webSiteURL: "https://open-ces.org",
        regionList: '[1000, 2000, 3000, 4000]',
        newAccountWizardURL: "https:/google.com",
        topOffWizardURL: "https:/google.com",
        androidAppURL: "https://google.com",
        iphoneAppURL: "https://google.com",
        androidAppLatestVersion: "1.0.0",
        iphoneAppLatestVersion: "1.0.0",
    }
    const currency = await createCurrency(currencyData);
    console.log("Currency created: " + currency.symbol);

    await createCurrencyMainAccount(currency);
    console.log("Currency main account created");

    return currency;
};

async function createDummyUsersAndAccount(symbol: string) {

    const currency = await getCurrencyBySymbol(symbol);

    if (currency) {

        const passwordHash = await argon2.hash(user_password);

        // user data
        const userData = [
            {
                email: "john.doe@opences.org",
                firstname: "John",
                lastname: "Doe",
                phone: "+32123456789",
                region: "EU",
                passwordHash: passwordHash,
            },
            {
                email: "jane.doe@opences.org",
                firstname: "Jane",
                lastname: "Doe",
                phone: "+32223456789",
                region: "EU",
                passwordHash: passwordHash,
            }
        ];

        for (const userInfo of userData) {
            console.log("Creating user: " + userInfo.email);

            const user = await createUser(userInfo.email, userInfo.phone, userInfo.passwordHash, "user", userInfo.firstname, userInfo.lastname);

            await setActiveUserById(user.id);

            const account = await createPersonalAccount(user, symbol);

            const mainCurrencyAccount = await getAccountByNumber(currency.mainCurrencyAccountNumber);

             if (mainCurrencyAccount) {
                await doFundAccount(mainCurrencyAccount, account, 100);
            }
        }
    }
}

async function resetDB() {
    await prisma.transaction.deleteMany({});
    await prisma.personalAccount.deleteMany({});
    await prisma.merchantAccount.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.currency.deleteMany({});
}

// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Initializing DB...")

    const symbol = "CES";

    await connectRedis();

    //await resetDB();

    await createAdminUser();

    await createCESCurrency(symbol);

    await createDummyUsersAndAccount(symbol);

    await redisClient.quit();

    console.log("DB Initialized");
}