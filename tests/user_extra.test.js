import assert from "node:assert";
import request from 'supertest';

import { app } from "../app.js"
import config from "./config.test.js";
import { getAccessTokenByEmailAndRole } from '../services/auth_service.js'
import { getUserByEmail, removeUser } from "../services/user_service.js";

describe("Test User Extra", () => {
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

    it('Get User By Email - user self', async () => {

        const email = config.user1Email;
        const res = await request(app)
            .get(`/api/user/by-email/${email}`)
            .set('Authorization', `Bearer ${user_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.email, email);

    });

    it('Get User By Email - admin self', async () => {
        const email = config.adminEmail;
        const res = await request(app)
            .get(`/api/user/by-email/${email}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.email, email);
    });

    it('Get User By Email - not self', async () => {
        const email = config.user1Email;
        const res = await request(app)
            .get(`/api/user/by-email/${email}`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.error, "Forbidden: Insufficient role");
    });

    it('Get User By Email - email not found', async () => {
        const email = config.user1Email;
        const res = await request(app)
            .get(`/api/user/by-email/test123@opences.org`)
            .set('Authorization', `Bearer ${admin_access_token}`)

        assert.equal(res.statusCode, 404);
        assert.equal(res.body.error, "User not found");
    });

    //Get current user detail
    it('Get Me - User', async () => {
        const res = await request(app)
            .get(`/api/user/me`)
            .set('Authorization', `Bearer ${user_access_token}`)
        
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.email, config.user1Email);
    });

    it('Get Me - Admin', async () => {
        const res = await request(app)
            .get(`/api/user/me`)
            .set('Authorization', `Bearer ${admin_access_token}`)
        
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.email, config.adminEmail);
    });
});
