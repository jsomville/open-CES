import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
//import { redisClient } from './redis/redisClient.js';
import { shutdown } from '../app.js'

import config from "./config.test.js";
import { getCurrencyBySymbol } from '../services/currency_service.js';
import { setUserIsActiveByEmail, deleteUserAndAccount, createUserAndAccount } from '../services/user_service.js';

//To calculate global test duration
let test_start_time;

//This is Global Before hook
before(async () => {

  //Set testing flag
  process.env.isTesting = true;

  // Check and Create Test Currency Symbol
  console.log("Setup - Before");
  test_start_time = Date.now();
  const before_start_time = Date.now();
  let currencyId;

  try {
    let currency = await getCurrencyBySymbol(config.testCurrency);
    if (!currency) {
      //Create Currency
      currency = await prisma.currency.create({
        data: {
          symbol: config.testCurrency,
          name: "CurrTest",
          country: "EU"
        }
      });
    }
    currencyId = currency.id;
  }
  catch (error) {
    console.log("Setup - Error with Currency")
    console.log(error);
  }

  // Delete user
  try {
    await deleteUserAndAccount(config.user1Email);

    await deleteUserAndAccount(config.user2Email);

    await deleteUserAndAccount(config.adminEmail);

  }
  catch (error) {
    console.log("Setup - Error with Delete User and Account")
    console.log(error);
  }

  //Create User
  try {

    await createUserAndAccount(config.user1Email, config.user1Password, config.user1Phone, "user", currencyId);

    await createUserAndAccount(config.user2Email, config.user2Password, config.user2Phone, "user", currencyId);

    await createUserAndAccount(config.adminEmail, config.adminPassword, config.adminPhone, "admin", currencyId);

  }
  catch (error) {
    console.log("Setup - Error create User and Account")
    console.log(error);
  }

  //Activate User
  try {

    await setUserIsActiveByEmail(config.user1Email);

    //await setUserIsActiveByEmail(config.user2Email);

    await setUserIsActiveByEmail(config.adminEmail);

  }
  catch (error) {
    console.log("Setup - Error create User and Account")
    console.log(error);
  }

  // Duration of before Hook
  const enlapsedTime = Date.now() - before_start_time;
  console.log(`Setup - Before Completed in ${enlapsedTime} ms`);
});

//This is global after hook
after(async () => {
  console.log("Setup - After");
  const after_start_time = Date.now();

  await deleteUserAndAccount(config.user1Email);

  await deleteUserAndAccount(config.user2Email);

  await deleteUserAndAccount(config.adminEmail);

  const enlapsedTime = Date.now() - after_start_time;
  console.log(`Setup - After Completed in ${enlapsedTime} ms`);

  const totalEnlapsedDuration = Date.now() - test_start_time;
  console.log(`Test Suite executed in  ${totalEnlapsedDuration} ms`);

  shutdown("Test cleanup");
});
