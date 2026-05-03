console.log("Testing startup...");

import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

console.log("Dependencies and their installed versions:");
for (const [name] of Object.entries(allDeps)) {
    try {
        const depPkg = require(`${name}/package.json`);
        console.log(`  ${name}: ${depPkg.version}`);
    } catch {
        console.log(`  ${name}: (not installed)`);
    }
}



import { prisma } from './utils/prisma.js';
import { getCurrencyBySymbol } from './services/currency_service.js';

console.log("After import");

let currency = await getCurrencyBySymbol("Z");

if (currency) {
    console.log(currency);
}