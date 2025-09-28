import express from 'express';

const router = express.Router();

import { readFile } from 'fs/promises';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));

const home_template = () => {
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
                 <table>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Access Token Duration</td>
                        <td>${process.env.ACCESS_TOKEN_DURATION}</td>
                    </tr>
                    <tr>
                        <td>Refresh Token Duration</td>
                        <td>${process.env.REFRESH_TOKEN_DURATION}</td>
                    </tr>
                   
                </table> 
            </div>
            <div class="footer">
                <div>
                    <div>GitHub : <a href= ${pkg.homepage}> ${pkg.homepage} </a> </Github>
                </div>
            </div>
        </body>
        </html>`
}

router.get('/', (req, res) => {
    res.send(home_template())
})

export default router;