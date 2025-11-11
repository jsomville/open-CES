import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import argon2 from 'argon2';

import { shutdown } from '../app.js'

import config from "./config.test.js";
import { createCurrency, getCurrencyBySymbol } from '../services/currency_service.js';
import { createUser, setActiveUserById } from '../services/user_service.js';
import { createPersonnalAccount, createCurrencyMainAccount, getAccountByNumber } from '../services/account_service.js';

//To calculate global test duration
let test_start_time;

//This is Global Before hook
before(async () => {

    //Set testing flag
    process.env.IS_TESTING = true;

    // Check and Create Test Currency Symbol
    console.log("Setup - Before");
    test_start_time = Date.now();
    const before_start_time = Date.now();

    let currencyId;

    try {
        let currency = await getCurrencyBySymbol(config.testCurrency);
        if (currency) {
            //Delete Transactions
            await prisma.transaction.deleteMany({
                where: {
                    currencyId: currency.id
                }
            });

            //Delete Personal Accounts
            await prisma.personalAccount.deleteMany({
                where: {
                    Account: {
                        currencyId: currency.id
                    }
                }
            });

            //Delete Merchant Accounts
            await prisma.merchantAccount.deleteMany({
                where: {
                    Account: {
                        currencyId: currency.id
                    }
                }
            });

            //Delete Accounts
            await prisma.account.deleteMany({
                where: {
                    currencyId: currency.id
                }
            });

            //Delete users
            await prisma.user.deleteMany({
                where: {
                    OR: [
                        { email: config.user1Email },
                        { email: config.user2Email },
                        { email: config.adminEmail }
                    ]
                }
            });
        }

        if (!currency) {
            const currencyData = {
                symbol: config.testCurrency,
                name: "Test Currency",
                country: "EU",
                accountMax: 10,
                logoURL: "image.png",
                webSiteURL: "https://example.org",
                regionList: '[1000, 2000, 3000, 4000]',
                newAccountWizardURL: "https:/google.com",
                topOffWizardURL: "https:/google.com",
                androidAppURL: "https://google.com",
                iphoneAppURL: "https://google.com",
                androidAppLatestVersion: "1.0.0",
                iphoneAppLatestVersion: "1.0.0",
            }
            currency = await createCurrency(currencyData);
            console.log(" - Currency created: " + currency.symbol);
        }
        currencyId = currency.id;

        //Create Main Account for Currency
        const mainAccount = await createCurrencyMainAccount(currency);
        console.log(" - Currency main account created: " + mainAccount.number);
    }
    catch (error) {
        console.log("Setup - Error with Currency")
        console.log(error);
    }

    //Create Users
    try {
        let user;
        let account;
        let userData;

        userData = {
            email: config.user1Email,
            firstname: "John",
            lastname: "Doe",
            phone: config.user1Phone,
            region: "EU",
            hashedPassword: await argon2.hash(config.user1Password),
        }
        user = await createUser(userData.email, userData.phone, userData.hashedPassword, "user", userData.firstname, userData.lastname);
        console.log(" - User created: " + user.email);

        await setActiveUserById(user.id);
        console.log(" - Active user set: " + user.email);

        account = await createPersonnalAccount(user, config.testCurrency);
        console.log(" - Account created for user " + user.email + " with account number " + account.number);

        userData = {
            email: config.user2Email,
            firstname: "John",
            lastname: "Doe",
            phone: config.user2Phone,
            region: "EU",
            hashedPassword: await argon2.hash(config.user2Password),
        }
        user = await createUser(userData.email, userData.phone, userData.hashedPassword, "user", userData.firstname, userData.lastname);
        console.log(" - User created: " + user.email);

        //await setActiveUserById(user.id);
        //console.log("Active user set: " + user.email);

        account = await createPersonnalAccount(user, config.testCurrency);
        console.log(" - Account created for user " + user.email + " with account number " + account.number);

        userData = {
            email: config.adminEmail,
            firstname: "John",
            lastname: "Doe",
            phone: config.adminPhone,
            region: "EU",
            hashedPassword: await argon2.hash(config.adminPassword),
        }
        user = await createUser(userData.email, userData.phone, userData.hashedPassword, "user", userData.firstname, userData.lastname);
        console.log(" - User created: " + user.email);

        await setActiveUserById(user.id);
        console.log(" - Active user set: " + user.email);

        account = await createPersonnalAccount(user, config.testCurrency);
        console.log(" - Account created for user " + user.email + " with account number " + account.number);

    }
    catch (error) {
        console.log("Setup Before", error);
        throw error;
    }

    // Duration of before Hook
    const enlapsedTime = Date.now() - before_start_time;
    console.log(` - Setup - Before Completed in ${enlapsedTime} ms`);
    console.log("");
});

//This is global after hook
after(async () => {
    console.log("Setup - After");
    const after_start_time = Date.now();
    try {
        let currency = await getCurrencyBySymbol(config.testCurrency);
        if (currency) {
            //Delete Transactions
            await prisma.transaction.deleteMany({
                where: {
                    currencyId: currency.id
                }
            });

            //Delete Personal Accounts
            await prisma.personalAccount.deleteMany({
                where: {
                    Account: {
                        currencyId: currency.id
                    }
                }
            });

            //Delete Merchant Accounts
            await prisma.merchantAccount.deleteMany({
                where: {
                    Account: {
                        currencyId: currency.id
                    }
                }
            });

            //Delete Accounts
            await prisma.account.deleteMany({
                where: {
                    currencyId: currency.id
                }
            });

            //Delete users
            await prisma.user.deleteMany({
                where: {
                    OR: [
                        { email: config.user1Email },
                        { email: config.user2Email },
                        { email: config.adminEmail }
                    ]
                }
            });

            await prisma.currency.deleteMany({
                where: {
                    id: currency.id
                }
            });

            console.log(" - Setup - Cleanup after tests completed");
        }
    }
    catch (error) {
        console.log(" - Setup After", error);
        throw error;
    }

    const enlapsedTime = Date.now() - after_start_time;
    console.log(` - Setup - After Completed in ${enlapsedTime} ms`);

    const totalEnlapsedDuration = Date.now() - test_start_time;
    console.log(` - Test Suite executed in  ${totalEnlapsedDuration} ms`);

    shutdown("Test cleanup");
});
