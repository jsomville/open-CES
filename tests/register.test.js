import assert from 'assert';
import request from 'supertest';

import { app } from "../app.js"

import { getCurrencyBySymbol } from "../services/currency_service.js";
import { deleteUserRegistrationByEmail, addUserRegistration } from "../services/register_service.js";
import { deleteUserAndAccount } from "../services/user_service.js";
import config from "./config.test.js";

describe("Registration", () => {

    let testCurrency = null;
    const registerTestMail = "john.doe@example.com"
    before(async () => {
        testCurrency = await getCurrencyBySymbol(config.testCurrency);

        try {
            await deleteUserRegistrationByEmail(registerTestMail)
        }
        catch (err) {

        }

         try {
            await deleteUserAndAccount(registerTestMail)
        }
        catch (err) {

        }
    });

    after(async () => {
        try {
            await deleteUserRegistrationByEmail(registerTestMail)
            await deleteUserAndAccount(registerTestMail)
        }
        catch (err) {

        }
    });

    //***************************************** */
    // Register a user
    //***************************************** */

    // Check server is running
    it('Register a user', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, "Registration successful, check your email for the confirmation code");

        await deleteUserRegistrationByEmail(registerTestMail)
        
    });

    it('Register a user - firstname missing', async () => {
        const payload = {
            //firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - lastname missing', async () => {
        const payload = {
            firstname: "John",
            //lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - email missing', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            //email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - region missing', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            //region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - phone missing', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            //phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - password missing', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            //password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - symbol missing', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            //symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    it('Register a user - registration already exists', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }
        await addUserRegistration(payload.email, payload.phone, payload.password, payload.firstname, payload.lastname, payload.region, "somecode", payload.symbol);

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Registration already exists");

        await deleteUserRegistrationByEmail(registerTestMail);
    });

    it('Register a user - user already exists', async () => {
        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: String(config.testUserEmail),
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }

        const res = await request(app)
            .post('/api/register')
            .send(payload);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

    //***************************************** */
    // Validate
    //***************************************** */
    it('Validate', async () => {
        const code = "123456";

        const payload = {
            firstname: "John",
            lastname: "Doe",
            email: registerTestMail,
            region: "EU",
            phone: "+3269890765",
            password: "TestABC123!",
            symbol: testCurrency.symbol
        }
        await addUserRegistration(payload.email, payload.phone, payload.password, payload.firstname, payload.lastname, payload.region, code, payload.symbol);

        const res = await request(app)
            .post(`/api/register/validate/${code}`)
            .send();

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, "Registration validated successfully");

        await deleteUserAndAccount(registerTestMail);
        
    });

    it('Validate - Invalid Code format', async () => {

        const code = "validcode12345"

        const res = await request(app)
            .post(`/api/register/validate/${code}`)
            .send();

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
    });

});
