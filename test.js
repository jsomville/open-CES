console.log("Testing startup...");

import { prisma } from './utils/prisma.js';
import { getCurrencyBySymbol } from './services/currency_service.js';

console.log("After import");

let currency = await getCurrencyBySymbol("Z");

if (currency) {
    console.log(currency);
}