import assert from "node:assert";
import request from 'supertest';

import app from "../app.js"
import config from "./config.test.js";
import { getAccessToken } from "../controller/idpController.js"

describe("Test User", () => {
    let admin_access_token;
    let user_access_token;

    before(async () => {
        // Create User Token
        const user_token_parameters = {
            "email" : config.userEmail,
            "role" : "user"
        }
        user_access_token = getAccessToken(user_token_parameters);
        //console.log(global.uat);
        
        // Create Admin Token
        const admin_token_parameters = {
            "email" : config.adminEmail,
            "role" : "admin"
        }
        admin_access_token = getAccessToken(admin_token_parameters);
        //console.log(global.aat)
    });

    it('List all User - Admin', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 200);
        assert.ok(!res.body.passwordHash);
    });

    it('List all User - User', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    let new_user_id = 0;
    const user_payload = {
        "firstname" : "user",
        "lastname" : "test",
        "email" : "test@opences.org",
        "phone" : "+32481040204",
        "region" : "EU",
        "password" : "TestPWD1234!"
    };
    
    it('Add User - User', async () => {
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(user_payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Add User - Admin', async () => {
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(user_payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.firstname, user_payload.firstname);
        assert.equal(res.body.lastname, user_payload.lastname);
        assert.equal(res.body.email, user_payload.email);
        assert.equal(res.body.phone, user_payload.phone);
        assert.equal(res.body.region, user_payload.region);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
        assert.ok(!res.body.passwordHash);

        new_user_id = res.body.id
    });

    it('Add User - No Payload', async () => {
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 422);
    });

    it('Add User - No Firstname', async () => {
        const payload = {
            //"firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : "123456789",
            "region" : "EU",
            "password" : "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Firstname field mandatory");
    });

    it('Add User - No Lastname', async () => {
        const payload = {
            "firstname" : "user",
            //"lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : "123456789",
            "region" : "EU",
            "password" : "Test1eee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Lastname field mandatory");
    });

    it('Add User - No email', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            //"email" : "test2@opences.org",
            "phone" : "123456789",
            "region" : "EU",
            "password" : "Test1etr23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Email field mandatory");
    });

    it('Add User - No phone', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            //"phone" : "123456789",
            "region" : "EU",
            "password" : "Test1ee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Phone field mandatory");
    });

    it('Add User - No region', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : "123456789",
            //"region" : "EU",
            "password" : "Test122123!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Region field mandatory");
    });

    it('Add User - No Password', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : "123456789",
            "region" : "EU",
            //"password" : "Test1ojjd23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Password field mandatory");
    });

    it('Add User - Password Too short', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : "123456789",
            "region" : "EU",
            "password" : "T",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Invalid Password policy");
    });

    it('Add User - Duplicated Email', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : user_payload.email,
            "phone" : "+32123456789",
            "region" : "EU",
            "password" : "Testiug123!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.error, "Email already used");
    });

    it('Add User - Duplicated Phone', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "email" : "test2@opences.org",
            "phone" : user_payload.phone,
            "region" : "EU",
            "password" : "Testiug123!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.error, "Phone already used");
    });

    it ('Get User - Admin', async () => {
        const res = await request(app)
            .get(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.firstname, user_payload.firstname);
        assert.equal(res.body.lastname, user_payload.lastname);
        assert.equal(res.body.email, user_payload.email);
        assert.equal(res.body.phone, user_payload.phone);
        assert.equal(res.body.region, user_payload.region);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it ('Get User - Invalid ID', async () => {
        const res = await request(app)
            .get(`/api/user/789456`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "User not found");
    });

    it ('Get User - User', async () => {
        const res = await request(app)
            .get(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    // Modify User
    it ('Modify User', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "phone" : user_payload.phone,
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.firstname, payload.firstname);
        assert.equal(res.body.lastname, payload.lastname);
        assert.equal(res.body.email, user_payload.email); //cannot be modified
        assert.equal(res.body.phone, payload.phone);
        assert.equal(res.body.region, payload.region);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    // Modify User
    it ('Modify User - Missing Firstname', async () => {
        const payload = {
            //"firstname" : "user",
            "lastname" : "test",
            "phone" : user_payload.phone,
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Firstname field mandatory");
    });

    // Modify User
    it ('Modify User - Missing Lastname', async () => {
        const payload = {
            "firstname" : "user",
            //"lastname" : "test",
            "phone" : user_payload.phone,
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Lastname field mandatory");
    });

    // Modify User
    it ('Modify User - Missing Phone', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            //"phone" : user_payload.phone,
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Phone field mandatory");
    });

    // Modify User
    it ('Modify User - Missing Region', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "phone" : user_payload.phone,
            //"region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 422);
        assert.equal(res.body.error, "Region field mandatory");
    });

    // Modify User
    it ('Modify User - Invalid ID', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "phone" : user_payload.phone,
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/12345678`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "User not found");
    });

    // Modify User
    it ('Modify User - Existing Phone', async () => {
        const payload = {
            "firstname" : "user",
            "lastname" : "test",
            "phone" : "+32471040204", //is the user phone used in test.setup.js
            "region" : "EU",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.error, "Phone already used");
    });

    it ('Delete User - Admin', async () => {
        const res = await request(app)
            .delete(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    it ('Delete User - User', async () => {
        const res = await request(app)
            .delete(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });
});