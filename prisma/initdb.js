import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

import { createCurrency, getCurrencyBySymbol } from '../services/currency_service.js';
import { createPersonnalAccount, createCurrencyMainAccount, getAccountByNumber} from '../services/account_service.js';
import { createUser, setActiveUserById } from '../services/user_service.js'
import { transferFunds } from '../services/transfer_service.js';

import { connectRedis, redisClient } from '../utils/redisClient.js';


const prisma = new PrismaClient();

async function createAdminUser() {
    const password = "OpenCES2025!";
    const email = "admin@opences.org"

    const userPwdHash = await argon2.hash(password);
    await prisma.user.create({
        data: {
            firstname: "admin",
            lastname: "admin",
            email: email,
            phone: "+32488040204",
            passwordHash: userPwdHash,
            role: "admin",
            isActive: true,
        }
    });

    console.log("admin user created")
}

async function createCESCurrency(symbol) {
    const currencyData = {
        symbol: symbol,
        name: "Open CES",
        country: "EU",
        accountMax: 1000,
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

    const account = await createCurrencyMainAccount(currency);
    console.log("Currency main account created: " + account.number);

    return currency;
};

async function createDummyUsersAndAccount(symbol) {

    const currency = await getCurrencyBySymbol(symbol);

    const hashedPassword = await argon2.hash("OpenCES123!");
    let accountId;
    let user;

    const user1Data = {
        email: "john.doe@opences.org",
        firstname: "John",
        lastname: "Doe",
        phone: "+32123456789",
        region: "EU",
        hashedPassword: hashedPassword,
    }
    user = await createUser(user1Data.email, user1Data.phone, user1Data.hashedPassword, "user", user1Data.firstname, user1Data.lastname);
    console.log("User created: " + user.email);

    await setActiveUserById(user.id);
    console.log("Active user set: " + user.email);

    const account1 = await createPersonnalAccount(user, symbol);
    console.log("Account created for user " + user.email + " with account number " + account1.number);

    await fundAccount(currency.mainCurrencyAccountNumber, account1, 1000);
    console.log("Funded account of user " + user.email + " with 1000 " + symbol);

    const user2Data = {
        email: "jane.doe@opences.org",
        firstname: "Jane",
        lastname: "Doe",
        phone: "+32223456789",
        region: "EU",
        hashedPassword: hashedPassword,
    }
    user = await createUser(user2Data.email, user2Data.phone, user2Data.hashedPassword, "user", user2Data.firstname, user2Data.lastname);
    console.log("User created: " + user.email);

    await setActiveUserById(user.id);
    console.log("Active user set: " + user.email);

    const account2 = await createPersonnalAccount(user, symbol);
    console.log("Account created for user " + user.email + " with account number " + account2.number);

    await fundAccount(currency.mainCurrencyAccountNumber, account2, 1000);
    console.log("Funded account of user " + user.email + " with 1000 " + symbol);
}

async function resetDB() {
    await prisma.transaction.deleteMany({});
    await prisma.personalAccount.deleteMany({});
    await prisma.merchantAccount.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.currency.deleteMany({});
}

async function fundAccount(currencyAccountNumber, toAccount, amount) {
    const fromAccount = await getAccountByNumber(currencyAccountNumber);

    const transferType = "Fund Account"
    const descriptionTo = `Fund from ${toAccount.number}`;
    const descriptionFrom = `Fund to ${fromAccount.number}`;
    await transferFunds(transferType, fromAccount, toAccount, amount, descriptionFrom, descriptionTo);
}


async function createAllCurrencys() {
    //"regionList": '[1000, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 1083, 1090, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210, 1212 ]',
}


// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Initializing DB...")

    const symbol = "CES";

    await connectRedis();

    await resetDB();

    await createAdminUser();

    await createCESCurrency(symbol);

    await createDummyUsersAndAccount(symbol);

    await redisClient.quit();

    console.log("DB Initialized");
}