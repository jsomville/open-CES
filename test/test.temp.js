import { describe, it } from "node:test";
import assert from "node:assert";
import request from 'supertest';
import app from "../app.js"
import {admin_access_token, user_access_token} from './test.setup.js'

describe("Test Currency", () => {

    it('List all currencies - User', async () => {
        //console.log("*************************************")
        //console.log(user_access_token)
        const res = await request(app)
            .get('/api/currency')
            .set('Authorization', `Bearer ${user_access_token}`);

            //.set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLnRlc3RAb3BlbmNlcy5vcmciLCJqdGkiOiJkNTIxNjMwYS1iM2NmLTRkYjUtYjNiNC01OWI3NGM0OGY0NjkiLCJyb2xlIjoidXNlciIsImF1ZCI6Ik9wZW5DRVMiLCJpYXQiOjE3NDYxMTgwNTUsImV4cCI6MTc0NjExODM1NSwiaXNzIjoiT3Blbi1DRVMifQ.k0K3Pe3M3WHki2N-Kg2NPHdytYjNCm6JiWldcD0XcIo');
            
        assert.equal(res.statusCode, 200);
    });


    it('List all currencies - Admin', async () => {
        //console.log("*************************************")
        //console.log(user_access_token)
        const res = await request(app)
            .get('/api/currency')
            .set('Authorization', `Bearer ${admin_access_token}`);

            //.set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi50ZXN0QG9wZW5jZXMub3JnIiwianRpIjoiOTBlZDZjODctOTVmMi00MjNiLTg0N2QtZWNiMGFhZWZjNzI1Iiwicm9sZSI6ImFkbWluIiwiYXVkIjoiT3BlbkNFUyIsImlhdCI6MTc0NjExOTEzNCwiZXhwIjoxNzQ2MTE5NDM0LCJpc3MiOiJPcGVuLUNFUyJ9.gAijf0udCz6RHI0DS7ZxwiOogPCJeNZvTwnj3gXig9E');
            
        assert.equal(res.statusCode, 200);
    });

  });