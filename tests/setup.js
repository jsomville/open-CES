import { before, after } from "node:test";
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";

const prisma = new PrismaClient()

let user = "";

import config from "./config.js";


//const userEmail = "user.test@opences.org";
//const userPassword = "OpenCES1234!"


before(async () =>{
  console.log("Test - Before");

  //Create User for testing
  const passwordHash = await argon2.hash(config.userPassword);
  user = await prisma.user.create({
    data:{
      firstname : "user",
      lastname : "test",
      email : config.userEmail,
      phone : "123456789",
      region : "EU",
      passwordHash : passwordHash,
      role : "user"
    }
  })
});

after(async () => {
  console.log("Test - After");
  
  // Delete User for testing
  await prisma.user.delete({
    where : { id : user.id}
  })
});
