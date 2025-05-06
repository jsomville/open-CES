import app from './app.js'

//Server Configurations
const PORT = process.env.PORT || 8000

import { readFile } from 'fs/promises';
const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

//Run the server
app.listen(PORT, () => {

    let environement = "in DEV";
    if (process.env.ENVIRO === "PRD"){
        environement = "in production";
    }

    console.log (`${pkg.name} Server is running on port ${PORT} - ${process.env.ENVIRO} - version: ${pkg.version}`);
})

export default app;