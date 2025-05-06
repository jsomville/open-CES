import express from 'express';

const router = express.Router();

import { readFile } from 'fs/promises';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

const welcome_text = "Welcome to Open-CES, this application exposes web api to manage exchange using local currency. This solution allows to manage currencies, users, accounts, vouchers and perform operations like top-off account, transfer."

const home_template = () => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta http-equiv='X-UA-Compatible' content='IE=edge'>
            <title>Home</title>
            <meta name='viewport' content='width=device-width, initial-scale=1'>
            <link rel='stylesheet' type='text/css' media='screen' href='main.css'>
            <script src='main.js'></script>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Open Currency Exchange System</h1>
                <h2>${pkg.version}</h2>
            </div>
            <div>
                <p>${welcome_text}</p>
            </div>
            <div>
                 <table>
                    <tr>
                        <th>Component</th>
                        <th>Version</th>
                    </tr>
                    <tr>
                        <td>Node.js</td>
                        <td>${process.version}</td>
                    </tr>
                     <tr>
                        <td>Access Token Duration</td>
                        <td>${process.env.ACCESS_TOKEN_DURATION}</td>
                    </tr>
                   
                </table> 

            </div>
        </body>
        </html>`
}

router.get('/', (req, res) => {
    res.send(home_template())
})

export default router;