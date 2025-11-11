import assert from "node:assert";
import request from 'supertest';

import { app } from "../app.js"
import config from "./config.test.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { getUserByEmail, removeUser } from "../services/user_service.js";


describe("Test User", () => {
    let admin_access_token;
    let user_access_token;
    let new_user_id = 0;

    const user_email = "test@opences.org";

    const user_payload = {
        firstname: "user",
        lastname: "test",
        email: user_email,
        phone: "+32481040204567",
        password: "TestPWD1234!"
    };

    before(async () => {
        //Get main Testing Tokens
        user_access_token = getAccessTokenByEmailAndRole(config.user1Email, "user");
        admin_access_token = getAccessTokenByEmailAndRole(config.adminEmail, "admin");

        const user = await getUserByEmail(user_payload.email);
        if (user) {
            await removeUser(user.id)
        }
    });

    after(async () => {
        const user = await getUserByEmail(user_payload.email);
        if (user) {
            await removeUser(user.id)
        }
    })

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
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    //***************************************** */
    // Add User
    //***************************************** */
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
        assert.equal(res.body.role, "user");
        assert.ok(res.body.id);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);

        new_user_id = res.body.id
    });

    it('Add User - User - Forbidden', async () => {
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(user_payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Add User - No Payload', async () => {
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
    });

    it('Add User - No Firstname', async () => {
        const payload = {
            //"firstname" : "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Firstname - Too short', async () => {
        const payload = {
            "firstname": "u",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Firstname - Too long', async () => {
        const payload = {
            "firstname": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - No Lastname', async () => {
        const payload = {
            "firstname": "user",
            //"lastname" : "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Test1eee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Lastname - Too short', async () => {
        const payload = {
            "firstname": "test",
            "lastname": "u",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Lastname - Too long', async () => {
        const payload = {
            "firstname": "test",
            "lastname": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Teestt1e23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - No email', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            //"email" : "test2@opences.org",
            "phone": "123456789",
            "password": "Test1etr23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Email too short', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "t@o.c",
            "phone": "123456789",
            "password": "Test1etr23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - No phone', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            //"phone" : "123456789",
            "password": "Test1ee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Phone too short', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "1234567",
            "password": "Test1ee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Phone too long', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "1234567890123456",
            "password": "Test1ee23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - No Password', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            //"password" : "Test1ojjd23!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password Too short', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "123Abc!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password Too long', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "123Abc!ABCDEFGHIJHLKLMNOPQRSTUVWXYZabcdefghijhlklmnopqrstuvwxyz123456",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password no numbers', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "Abcdefghig!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password no Uppercase', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "abcdefghi9!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password no Lowercase', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "ABCDE7GH!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Password no special characters', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "ABCDEfgh1",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Other field', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": "123456789",
            "password": "ABCDEfgh1!",
            "other": "field",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Add User - Duplicated Email', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": user_payload.email,
            "phone": "+32123456789",
            "password": "Testiug123!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Email already used");
    });

    it('Add User - Duplicated Phone', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "email": "test2@opences.org",
            "phone": user_payload.phone,
            "password": "Testiug123!",
        }
        const res = await request(app)
            .post('/api/user')
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Phone already used");
    });

    //***************************************** */
    // GET User
    //***************************************** */
    it('Get User - Admin', async () => {
        const res = await request(app)
            .get(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.firstname, user_payload.firstname);
        assert.equal(res.body.lastname, user_payload.lastname);
        assert.equal(res.body.email, user_payload.email);
        assert.equal(res.body.phone, user_payload.phone);
        assert.ok(res.body.createdAt)
        assert.ok(res.body.updatedAt)
    });

    it('Get User - Invalid ID', async () => {
        const res = await request(app)
            .get(`/api/user/789456`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "User not found");
    });

    it('Get User - User', async () => {
        const res = await request(app)
            .get(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    //***************************************** */
    // Modify User
    //***************************************** */
    it('Modify User - Admin', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": user_payload.phone,
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
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
    });

    it('Modify User - User', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Modify User - User self', async () => {

        const user = await getUserByEmail(config.user1Email)

        const payload = {
            "firstname": user.firstname,
            "lastname": user.lastname,
            "phone": user.phone,
        };

        const res = await request(app)
            .put(`/api/user/${user.id}`)
            .set('Authorization', `Bearer ${user_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.firstname, payload.firstname);
        assert.equal(res.body.lastname, payload.lastname);
        assert.equal(res.body.phone, payload.phone);
        assert.ok(res.body.createdAt);
        assert.ok(res.body.updatedAt);
    });

    it('Modify User - Missing Firstname', async () => {
        const payload = {
            //"firstname" : "user",
            "lastname": "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Firstname Too short', async () => {
        const payload = {
            "firstname": "u",
            "lastname": "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Firstname Too long', async () => {
        const payload = {
            "firstname": "uABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789",
            "lastname": "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Missing Lastname', async () => {
        const payload = {
            "firstname": "user",
            //"lastname" : "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Lastname too short', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "a",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Lastname too long', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "uABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Missing Phone', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            //"phone" : user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Phone too short', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": "123"
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Phone too long', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": "12345678912345678",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Other field', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": "+3259684265",
            "other": "field",
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - ID not found', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": "+3259684265",
        };

        const res = await request(app)
            .put(`/api/user/12345678`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "User not found");
    });

    it('Modify User - ID as string', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": user_payload.phone,
        };

        const res = await request(app)
            .put(`/api/user/abc`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Modify User - Existing Phone', async () => {
        const payload = {
            "firstname": "user",
            "lastname": "test",
            "phone": config.user1Phone,
        };

        const res = await request(app)
            .put(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`)
            .send(payload)

        assert.equal(res.statusCode, 409);
        assert.equal(res.body.message, "Phone already used");
    });

    //***************************************** */
    // Set Admin
    //***************************************** */
    it('set Admin by User', async () => {
        const res = await request(app)
            .post(`/api/user/${new_user_id}/set-admin`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('set Admin by Admin', async () => {
        const res = await request(app)
            .post(`/api/user/${new_user_id}/set-admin`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    //***************************************** */
    // Set active
    //***************************************** */
    it('set active by User', async () => {
        const res = await request(app)
            .post(`/api/user/${new_user_id}/set-active`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('set active by Admin', async () => {
        const res = await request(app)
            .post(`/api/user/${new_user_id}/set-active`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    it('set active user not found', async () => {
        const res = await request(app)
            .post(`/api/user/123456789/set-active`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "User not found");
    });

    //***************************************** */
    // Delete
    //***************************************** */
    it('Delete User - User', async () => {
        const res = await request(app)
            .delete(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${user_access_token}`);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "Forbidden: Insufficient role");
    });

    it('Delete User - Admin', async () => {
        const res = await request(app)
            .delete(`/api/user/${new_user_id}`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 204);
    });

    it('Delete User -User id not found', async () => {
        const res = await request(app)
            .delete(`/api/user/123456789`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.message, "User not found");
    });

    it('Delete User -User id as string', async () => {
        const res = await request(app)
            .delete(`/api/user/abc`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

    it('Delete User -User id as float', async () => {
        const res = await request(app)
            .delete(`/api/user/4.5`)
            .set('Authorization', `Bearer ${admin_access_token}`);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Validation failed");
        assert.ok(res.body.errors);
        assert.strictEqual(res.body.errors.length, 1);
    });

});