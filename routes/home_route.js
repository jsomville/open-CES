import express from 'express';

const router = express.Router();

import { readFile } from 'fs/promises';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

import { getCurrencyListWithStats } from '../services/currency_service.js';

const home_template = (currencyList) => {
    const currencyRows = currencyList.map(currency => `
        <tr>
            <td>
                <a href="${currency.webSiteURL}" target="_blank" rel="noopener noreferrer" alt="${currency.name} logo">
                    <img src="${currency.logoURL}" alt="${currency.name} logo" width="32" height="32"/>
                </a>
            </td>
            <td>${currency.symbol}</td>
            <td>${currency.country}</td>
            <td>${currency.merchantCount}</td>
            <td>${currency.accountCount}</td>
            <td>${currency.activeAccount}</td>
            <td>${currency.balance * -1}</td>
            <td>${currency.monthlyTransVol}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta http-equiv='X-UA-Compatible' content='IE=edge'>
            <title>Open CES - Home</title>
            <meta name='viewport' content='width=device-width, initial-scale=1'>
            <link rel='stylesheet' type='text/css' media='screen' href='main.css'>
            <script src='main.js'></script>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to <b>${pkg.name}</b></h1>
                <div class="version-badge">
                    <strong>Version ${pkg.version}</strong>
                </div>
            </div>
            <div class="content">
                <p>${pkg.description}</p>
            </div>
            <div class="content">
                <h2>Available Currencies</h2>
                <table border="1" cellpadding="5" cellspacing="0">
                    <tr>
                        <th>Logo</th>
                        <th>Symbol</th>
                        <th>Country</th>
                        <th>Merchants</th>
                        <th>Accounts</th>
                        <th>Active Accounts</th>
                        <th>Balance</th>
                        <th>Monthly Transaction Volume</th>
                    </tr>
                    ${currencyRows}
                </table>
            </div>
            <br/>
            <div class="footer">
                <div>
                    <div>GitHub : <a href="${pkg.homepage}" target="_blank" rel="noopener noreferrer">${pkg.homepage}</a></div>
                </div>
            </div>

        </body>
        </html>`
}

router.get('/', async (req, res) => {
    try {
        const currencyList = await getCurrencyListWithStats();

        //console.log(currencyList);

        res.send(home_template(currencyList));
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Error loading page');
    }
})

export default router;