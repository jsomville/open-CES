import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function init() {

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

async function deleteAllTransactions() {

    await prisma.transaction.deleteMany();
}

async function createTransactions() {
    const accountid = 1597;
    const currencyId = 1;
    const destinationId = 1596
    let amount;

    amount = 3.88
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 1
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 10
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 24.7
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 53.46
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 10.99
    await createOneTransaction(accountid, amount, currencyId, destinationId)

    amount = 6.33
    await createOneTransaction(accountid, amount, currencyId, destinationId)

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
    console.log("init is running")
    init();
    //deleteAllTransactions();
    //createTransactions();
}