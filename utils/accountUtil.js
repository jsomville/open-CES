// Account Type Enum - Maps account types to numeric values
export const AccountType = Object.freeze({
    CURRENCY_MAIN: 1,
    PERSONAL: 2,
    MERCHANT: 3,
    CURRENCY_CASHBACK: 4,
});

// Reverse mapping - Get name from number
export const getAccountTypeName = (value) => {
    return Object.keys(AccountType).find(key => AccountType[key] === value) || 'UNKNOWN';
};

// Validate account type
export const isValidAccountType = (value) => {
    return Object.values(AccountType).includes(value);
};

export const getAccountId = (accountType, currencyNumber, accountNumber) => {
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

const sumDigits = (number) => {
  return Math.abs(number)
    .toString()
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit), 0);
};

export const isValidAccountId = (accountId) => {
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