import { before, after } from "node:test";
import argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";

const prisma = new PrismaClient()

let user = "";
let admin = "";

import config from "./test.config.js";

let user_access_token;
let admin_access_token;

before(async () =>{
  console.log("Test - Before");

  //Create User for testing
  const userPwdHash = await argon2.hash(config.userPassword);
  user = await prisma.user.create({
    data:{
      firstname : "user",
      lastname : "test",
      email : config.userEmail,
      phone : "+32471040204",
      region : "EU",
      passwordHash : userPwdHash,
      role : "user"
    }
  });

  // Generate User Token
  const user_payload = {
    "username" : config.userEmail,
    "password" : config.userPassword
  }
  const user_res = await request(app)
    .post('/api/idp/login')
    .send(user_payload)
  user_access_token = user_res.body.accessToken;


  //Create Admin User for testing
  const passwordHash = await argon2.hash(config.adminPassword);
  admin = await prisma.user.create({
    data:{
      firstname : "admin",
      lastname : "test",
      email : config.adminEmail,
      phone : "+32471040205",
      region : "EU",
      passwordHash : passwordHash,
      role : "admin"
    }
  });

  // Generate Admin Token
  const admin_payload = {
    "username" : config.adminEmail,
    "password" : config.adminPassword
  }
  const admin_res = await request(app)
    .post('/api/idp/login')
    .send(admin_payload)
  admin_access_token = admin_res.body.accessToken;
  
});

after(async () => {
  console.log("Test - After");
  
  // Delete User for testing
  await prisma.user.delete({
    where : { id : user.id}
  })

  // Delete admin for testing
  await prisma.user.delete({
    where : { id : admin.id}
  })
});

export {user_access_token, admin_access_token}
