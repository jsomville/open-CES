import { before, after } from "node:test";
import argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";
import { getAccessToken } from "../controller/idpController.js"
import config from "./config.test.js";

const prisma = new PrismaClient()

let user = "";
let admin = "";

//This is Global Before hook
before(async () =>{
  //console.log("Setup - Before");

  global.hello = await getUserAndTokens();

  //console.log("Setup - Before Completed");
});

//This is global after hook
after(async () => {
  //console.log("Setup - After");
  
  // Delete User for testing
  await prisma.user.delete({
    where : { id : user.id}
  })

  // Delete admin for testing
  await prisma.user.delete({
    where : { id : admin.id}
  })

  //console.log("Setup - After Completed");
});

// ********************************************************
async function getUserAndTokens(){
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

    const user_token_parameters = {
      "email" : config.userEmail,
      "role" : "user"
    }
    const user_access_token = getAccessToken(user_token_parameters)
    global.uat = user_access_token;
    //console.log(user_access_token);

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
    
    const admin_token_parameters = {
      "email" : config.adminEmail,
      "role" : "admin"
    }
    const admin_access_token = getAccessToken(admin_token_parameters);
    //console.log(admin_access_token);
    global.aat = admin_access_token;
}


