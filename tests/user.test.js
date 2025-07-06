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

  const user_payload = {
    "firstname": "user",
    "lastname": "test",
    "email": "test@opences.org",
    "phone": "+32481040204",
    "region": "EU",
    "password": "TestPWD1234!"
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

  it('Add User - User', async () => {
    const res = await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${user_access_token}`)
      .send(user_payload)

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
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
    assert.equal(res.body.role, "user");
    assert.ok(res.body.id);
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);

    new_user_id = res.body.id
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
      "region": "EU",
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
      "region": "EU",
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

  it('Add User - No email', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      //"email" : "test2@opences.org",
      "phone": "123456789",
      "region": "EU",
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
      "region": "EU",
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

  it('Add User - No region', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "email": "test2@opences.org",
      "phone": "123456789",
      //"region" : "EU",
      "password": "Test122123!",
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
      "region": "EU",
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
      "region": "EU",
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

  it('Add User - Password no numbers', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "email": "test2@opences.org",
      "phone": "123456789",
      "region": "EU",
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
      "region": "EU",
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
      "region": "EU",
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
      "region": "EU",
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
      "region": "EU",
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
      "region": "EU",
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
      "region": "EU",
      "password": "Testiug123!",
    }
    const res = await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Phone already used");
  });

  it('Get User - Admin', async () => {
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

  it('Get User By Email - user self', async () => {

    //get Temporary Token

    const email = config.user1Email;
    const res = await request(app)
      .get(`/api/user/by-email/${email}`)
      .set('Authorization', `Bearer ${user_access_token}`)

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.email, email);

  });

  it('Get User By Email - admin self', async () => {

    //get Temporary Token

    const email = config.adminEmail;
    const res = await request(app)
      .get(`/api/user/by-email/${email}`)
      .set('Authorization', `Bearer ${admin_access_token}`)

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.email, email);
  });

  it('Get User By Email - not self', async () => {

    //get Temporary Token

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

  // Modify User
  it('Modify User', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "phone": user_payload.phone,
      "region": "EU",
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
  it('Modify User - Missing Firstname', async () => {
    const payload = {
      //"firstname" : "user",
      "lastname": "test",
      "phone": user_payload.phone,
      "region": "EU",
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

  // Modify User
  it('Modify User - Missing Lastname', async () => {
    const payload = {
      "firstname": "user",
      //"lastname" : "test",
      "phone": user_payload.phone,
      "region": "EU",
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

  // Modify User
  it('Modify User - Missing Phone', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      //"phone" : user_payload.phone,
      "region": "EU",
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

  // Modify User
  it('Modify User - Missing Region', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "phone": user_payload.phone,
      //"region" : "EU",
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
      "phone": user_payload.phone,
      "region": "EU",
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

  // Modify User
  it('Modify User - Invalid ID', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "phone": user_payload.phone,
      "region": "EU",
    };

    const res = await request(app)
      .put(`/api/user/12345678`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "User not found");
  });

  // Modify User
  it('Modify User - Existing Phone', async () => {
    const payload = {
      "firstname": "user",
      "lastname": "test",
      "phone": config.user1Phone,
      "region": "EU",
    };

    const res = await request(app)
      .put(`/api/user/${new_user_id}`)
      .set('Authorization', `Bearer ${admin_access_token}`)
      .send(payload)

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Phone already used");
  });

  it('Modify User - set Admin by User', async () => {
    const res = await request(app)
      .post(`/api/user/${new_user_id}/set-admin`)
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Modify User - set Admin by Admin', async () => {
    const res = await request(app)
      .post(`/api/user/${new_user_id}/set-admin`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 204);
  });

  it('Modify User - set active by User', async () => {
    const res = await request(app)
      .post(`/api/user/${new_user_id}/set-active`)
      .set('Authorization', `Bearer ${user_access_token}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Forbidden: Insufficient role");
  });

  it('Modify User - set active by Admin', async () => {
    const res = await request(app)
      .post(`/api/user/${new_user_id}/set-active`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 204);
  });

  it('Modify User - set active user not found', async () => {
    const res = await request(app)
      .post(`/api/user/123456789/set-active`)
      .set('Authorization', `Bearer ${admin_access_token}`);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "User not found");
  });

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