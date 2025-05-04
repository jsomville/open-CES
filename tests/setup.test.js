import { before, after } from "node:test";
import argon2 from 'argon2';
import request from 'supertest';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";
import { getAccessToken } from "../controller/idpController.js"
import config from "./config.test.js";

const prisma = new PrismaClient()

let user_id;
let admin_id;

//This is Global Before hook
before(async () =>{
  console.log("Setup - Before");
  try{
      const userPwdHash = await argon2.hash(config.userPassword);
      const user = await prisma.user.create({
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
      
      user_id = user.id;

      const user_token_parameters = {
        "email" : config.userEmail,
        "role" : "user"
      }
      const user_access_token = getAccessToken(user_token_parameters)

      //Create Admin User for testing
      const passwordHash = await argon2.hash(config.adminPassword);
      const admin = await prisma.user.create({
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
      
      admin_id = admin.id;
      
      const admin_token_parameters = {
        "email" : config.adminEmail,
        "role" : "admin"
      }
      const admin_access_token = getAccessToken(admin_token_parameters);
  }
  catch(error){
    console.log(error);
  }

  console.log("Setup - Before Completed");
});

//This is global after hook
after(async () => {
  console.log("Setup - After");
 
  //Delete User's Account
  await prisma.account.deleteMany({
    where : { 
      userId : user_id
    }
  });

  //Delete User's Account
  await prisma.account.deleteMany({
    where : { 
      userId : admin_id
    }
  });

  // Delete User for testing
  await prisma.user.delete({
    where : { id : user_id}
  });

  // Delete admin for testing
  await prisma.user.delete({
    where : { id : admin_id}
  });

  console.log("Setup - After Completed");
});