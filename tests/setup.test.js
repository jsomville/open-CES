import { before, after } from "node:test";
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'

import app from "../app.js";
import { getAccessToken } from "../controller/idpController.js"
import { getUserByEmail } from '../controller/userController.js';
import {getCurrencyBySymbol} from '../controller/currencyController.js'
import config from "./config.test.js";

const prisma = new PrismaClient()

const deleteUserAndAccount = async (email) =>{
  const user = await getUserByEmail(email);
  if (user) {
    //Delete User's Account
    await prisma.account.deleteMany({
      where : { 
        userId : user.id
      }
    });

    //Delete User
    await prisma.user.delete({
      where : { id : user.id}
    });
  }
}

const createUserAndAccount = async(email, password, phone, role, currencyId) =>{
  const pwdHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data:{
      firstname : "user",
      lastname : "test",
      email : email,
      phone : phone,
      region : "EU",
      passwordHash : pwdHash,
      role : role
    }
  });

  if (role == "user")
  {
    // Create Account
    await prisma.account.create({
      data:{
        userId : user.id,
        currencyId : currencyId,
        accountType : 1, // TO FIX
      }
    })
  }
}


//This is Global Before hook
before(async () =>{
  console.log("Setup - Before");
  let currencyId;
  try{

      let currency = await getCurrencyBySymbol(config.testCurrency);
      if (!currency){
        //Create Currency
        currency = await prisma.currency.create({
          data:{
              symbol: config.testCurrency,
              name: "CurrTest",
              country : "EU"
          }
        });
      }
      currencyId = currency.id;
  }
  catch(error){
    console.log("Setup - Error with Currency")
    console.log(error);
  }

  try{
      await deleteUserAndAccount(config.user1Email);

      await deleteUserAndAccount(config.user2Email);

      await deleteUserAndAccount(config.adminEmail);
    
  }
  catch(error){
    console.log("Setup - Error with Delete User and Account")
    console.log(error);
  }

  try{

      await createUserAndAccount(config.user1Email, config.user1Password, config.user1Phone, "user", currencyId);

      await createUserAndAccount(config.user2Email, config.user2Password, config.user2Phone, "user", currencyId);

      await createUserAndAccount(config.adminEmail, config.adminPassword, config.adminPhone, "admin", currencyId);
    
  }
  catch(error){
    console.log("Setup - Error create User and Account")
    console.log(error);
  }

  console.log("Setup - Before Completed");
});

//This is global after hook
after(async () => {
  console.log("Setup - After");
 
  await deleteUserAndAccount(config.user1Email);

  await deleteUserAndAccount(config.user2Email);

  await deleteUserAndAccount(config.adminEmail);

  console.log("Setup - After Completed");
});

