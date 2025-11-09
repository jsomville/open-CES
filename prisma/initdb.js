import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

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
            region: "EU",
            passwordHash: userPwdHash,
            role: "admin",
            isActive: true,
        }
    });
    console.log("admin user created")
}

async function createCESCurrency() {
    const currency = await prisma.currency.create({
        data: {
            name: "Open CES",
            symbol: "CES",
            country: "EU",
            logo: "ces.png",
            webSiteURL: "https://open-ces.org",
            regionList: '[1000, 1030, 1040, 1050, 1060 ]',
        }
    });
    console.log("CES currency created");

    await prisma.account.create({
        data: {
            userId: 1,
            currencyId: currency.id,
            accountType: AccountType.CURRENCY_MAIN,
        }
    });
}

async function createDummyUsersAndAccounts() {

}

async function createAllCurrencys() {
    //"regionList": '[1000, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 1083, 1090, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210, 1212 ]',
}

const createOneTransaction = async (accountId, amount, currencyId, destinationId,) => {
    await prisma.transaction.create({
        data: {
            accountId: accountId,
            amount: amount,
            currencyId: currencyId,
            description: `Transfer to account # ${destinationId}`,
            transactionType: "Transfer",
            status: "Completed"
        }
    })
}

// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Initializing DB...")

    await createAdminUser();

    await createCESCurrency();

    console.log("DB Initialized");
}