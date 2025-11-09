// Account Type Enum - Maps account types to numeric values
export const AccountType = Object.freeze({
  CURRENCY_MAIN: 1,
  CURRENCY_CASHBACK: 2,
  PERSONAL: 100,
  MERCHANT: 200,
});

// Reverse mapping - Get name from number
export const getAccountTypeName = (value) => {
  return Object.keys(AccountType).find(key => AccountType[key] === value) || 'UNKNOWN';
};

// Validate account type
export const isValidAccountType = (value) => {
  return Object.values(AccountType).includes(value);
};
