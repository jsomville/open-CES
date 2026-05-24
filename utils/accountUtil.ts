// Account Type Enum - Maps account types to numeric values
export const AccountType = Object.freeze({
    CURRENCY_MAIN: 1,
    PERSONAL: 2,
    MERCHANT: 3,
    CURRENCY_CASHBACK: 4,
});

// Reverse mapping - Get name from number
export const getAccountTypeName = (value : number) => {
    return Object.keys(AccountType).find(key => AccountType[key as keyof typeof AccountType] === value) || 'UNKNOWN';
};

// Validate account type
export const isValidAccountType = (value: number): boolean => {
    return Object.values(AccountType).includes(value as any);
};

export const getAccountId = (accountType : number, currencyNumber: number, accountNumber: number) => {
    // 000-0000-00000
    // XXX-XXXX-00000 --> auto increment currency number
    // XXX-0000-XXXXX --> auto increment account number
    // 0XX-XXXX-XXXXX --> Account Type
    // X0X-XXXX-XXXXX --> modulus on currency number
    // XX0-XXXX-XXXXX --> modulus on account number

    const modulusAccountNumber = sumDigits(accountNumber) % 10;
    const modulusCurrencyNumber = sumDigits(currencyNumber) % 10;

    const prefix = String(accountType) + String(modulusCurrencyNumber) + String(modulusAccountNumber);
   
    return prefix + "-" + String(currencyNumber).padStart(4, '0') + "-" + String(accountNumber).padStart(5, '0');
};

const sumDigits = (number: number): number => {
  return Math.abs(number)
    .toString()
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit), 0);
};

export const isValidAccountId = (accountId: string): boolean => {
    const regex = /^(\d)(\d)(\d)-(\d{4})-(\d{5})$/;
    const match = accountId.match(regex);
    if (!match) {
        return false;
    }

    const accountType = parseInt(match[1], 10);
    const modulusCurrencyNumber = parseInt(match[2], 10);
    const modulusAccountNumber = parseInt(match[3], 10);
    const currencyNumber = parseInt(match[4], 10);
    const accountNumber = parseInt(match[5], 10);

    if (!isValidAccountType(accountType)) {
        return false;
    }

    const calculatedModulusCurrency = sumDigits(currencyNumber) % 10;
    const calculatedModulusAccount = sumDigits(accountNumber) % 10;

    return (modulusCurrencyNumber === calculatedModulusCurrency) && (modulusAccountNumber === calculatedModulusAccount);
}

export const isValidAccountId2 = (accountId: string): boolean => {
    const regex = /^(\d{3})-(\d{4})-(\d{5})$/;
    const match = accountId.match(regex);
    if (!match) {
        console.log("  Account ID format is invalid - regex does not match");
        return false;
    }

    // get the last 2 digits of the accountId
    const check = accountId.slice(-2);

    //convert the last 2 digits to a number
    const checkNumber = parseInt(check, 10);
    console.log(`  Check number extracted from account ID: ${checkNumber}`);

    //get the rest of the accountID without the last 2 digits
    const rest = accountId.slice(0, -2).replace(/-/g, '');

    //convert the rest of the accountId to a number
    const restNumber = parseInt(rest, 10);

    //check the modulus of the rest number with 97
    const modulus = restNumber % 97;
    console.log(`  Rest of the account ID as number: ${restNumber}`);
    console.log(`  Calculated modulus (restNumber % 97): ${modulus}`);

    //the check number should be equal to the modulus
    return checkNumber === modulus;

}

export const getAccountId2 = (accountType : number, currencyNumber: number, accountNumber: number) => {
    // 000-0000-000%% --> where %%% is the modulus 97 of the rest of the accountId
    // 0XX-XXXX-XXX%% --> Account Type
    // X00-xxXX-XXX%% --> currency number less significatif number for 1234 --> 34
    // Xxx-00XX-XXX%% --> currency number less significatif number for 1234 --> 12
    // XXX-XXX0-000%% --> account number
    
    const currencyNumberMSN = Math.floor(currencyNumber / 100);
    const currencyNumberLSN = currencyNumber % 100;

    const nb = accountType * 1000000000 + currencyNumberLSN * 10000000 + currencyNumberMSN * 100000 + (accountNumber % 10000);
    const strNb = String(nb)

    //gt the modulus 97 of the number
    const modulus = nb % 97;

    //get the first 3 characters of the strNB
    const prefix = strNb.slice(0, 3);

    //get the next 4 characters of the strNB
    const middle = strNb.slice(3, 7);
    
    //get the next 3 characters of the strNB
    const suffix = strNb.slice(7, 10);

    //assemble the accountID in this format : XXX-XXXX-XXX%% where %%% is the modulus 97 of the rest of the accountId
    return prefix + "-" + middle + "-" + suffix + modulus.toString().padStart(2, '0');
};