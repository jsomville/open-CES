import assert from "node:assert";
import request from 'supertest';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import app from "../app.js";
import config from "./config.test.js";
import { getAccessToken } from "../controller/idpController.js";
import { getUserByEmail } from '../controller/userController.js';
import { createUserAndAccount, deleteUserAndAccount, getAccountIdByEmailAndCurrencySymbol } from "../controller/helper.js";

describe("Test Currency", () => {
    let admin_access_token;
    let user_access_token;

    let currency_id;
    const symbol="AAA";
    const testUserEmail = "test@AAA.com"
    let account_id;
    const amount = 2.22;

    before(async () => {
        try{
            // Create User Token
            const user_token_parameters = {
                "email" : config.user1Email,
                "role" : "user"
            }
            user_access_token = getAccessToken(user_token_parameters)
            
            // Create Admin Token
            const admin_token_parameters = {
                "email" : config.adminEmail,
                "role" : "admin"
            }
            admin_access_token = getAccessToken(admin_token_parameters);

            //Get currency if exist
            let currency = await prisma.currency.findUnique({where: {symbol : symbol}})
            if (currency)
            {
                //Delete Transactions
                await prisma.transaction.deleteMany({
                    where :{
                        currencyId : currency.id
                    }
                })

                //Delete User and accounts
                await deleteUserAndAccount(testUserEmail);

                //Delete Currency
                await prisma.currency.delete({
                    where :{
                        symbol : symbol
                    }
                });
            }

            //Create Currency
            currency = await prisma.currency.create({
                data:{
                    symbol: symbol,
                    name: "TEST Currency",
                    country : "EU"
                }
            })
            currency_id = currency.id;

            await createUserAndAccount(testUserEmail, "any", "+32123456889", "user", currency_id);

            const account = await getAccountIdByEmailAndCurrencySymbol(testUserEmail, currency_id);

            account_id = account.id;
        }
        catch(error){
            console.log(error.message);
        }
    });

    after( async() => {
        //Get currency if exist
        let currency = await prisma.currency.findUnique({where: {symbol : symbol}})
        if (currency)
        {
            //Delete Transactions
            await prisma.transaction.deleteMany({
                where :{
                    currencyId : currency.id
                }
            })

            //Delete User and accounts
            await deleteUserAndAccount(testUserEmail);

            //Delete Currency
            await prisma.currency.delete({
                where :{
                    symbol : symbol
                }
            });
        }

    });

    it ('Fund Account - User', async () => {
        const payload = {
            "account" : 22,
            "amount" : amount,
        }
        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it ('Fund Account - Admin', async () => {
        
        const payload = {
            "account" : account_id,
            "amount" : amount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/fundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account Balance
        const account = await getAccountIdByEmailAndCurrencySymbol(testUserEmail, currency_id);
        if (!account){
            throw new Error("Account not found");
        }
        assert.equal(account.balance, Number(amount));

        //get The currency Balance
        const currency = await prisma.currency.findUnique({where: {symbol : symbol}});
        if (!currency){
            throw new Error("Currency not found");
        }
        const balance = Number(currency.balance) + Number(amount)
        assert.equal(balance, 0);

        //get The Transaction
        const transaction = await prisma.transaction.findMany({where : {currencyId : currency_id}} )
        assert(transaction.length > 0);
    
    });

    it ('ReFund Account - Admin', async () => {
        const payload = {
            "account" : account_id,
            "amount" : amount,
        }

        const res = await request(app)
            .post(`/api/currency/${currency_id}/refundAccount`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);

        //Get the account Balance
        const account = await getAccountIdByEmailAndCurrencySymbol(testUserEmail, currency_id);
        if (!account){
            throw new Error("Account not found");
        }
        assert.equal(account.balance, 0);

        //get The currency Balance
        const currency = await prisma.currency.findUnique({where: {symbol : symbol}});
        if (!currency){
            throw new Error("Currency not found");
        }
        assert.equal(Number(currency.balance) , 0);
        
    });

})
