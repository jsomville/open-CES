import { before, after } from "node:test";
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";

const prisma = new PrismaClient()

let user = "";
let admin = "";

import config from "./config.js";


before(async () =>{
  console.log("Test - Before");

  //Create User for testing
  const userPwdHash = await argon2.hash(config.userPassword);
  user = await prisma.user.create({
    data:{
      firstname : "user",
      lastname : "test",
      email : config.userEmail,
      phone : "123456789",
      region : "EU",
      passwordHash : userPwdHash,
      role : "user"
    }
  })

  //Create Admin Uer for testing
  const passwordHash = await argon2.hash(config.adminPassword);
  admin = await prisma.user.create({
    data:{
      firstname : "admin",
      lastname : "test",
      email : config.adminEmail,
      phone : "123456789",
      region : "EU",
      passwordHash : passwordHash,
      role : "admin"
    }
  })
  
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
