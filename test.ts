console.log("Testing startup...");

import {getAccountId2, isValidAccountId2} from "./utils/accountUtil.ts";

// to run : npx tsx --env-file=.env test.ts

// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Start testing...");
    
    let accountID
    accountID = "acc_1234567890";
    console.log(`Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

    accountID = "123-1234-12345";
    console.log(`Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

    accountID = "123-1234-12328";
    console.log(`Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

    accountID = getAccountId2(1, 1, 1);
    console.log(`Generated Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

    accountID = getAccountId2(1, 1234, 1234);
    console.log(`Generated Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

    accountID = getAccountId2(1, 9999, 9999);
    console.log(`Generated Account ID : ${accountID} is : ${isValidAccountId2(accountID) ? "valid" : "invalid"}`);

}