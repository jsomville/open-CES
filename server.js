import { app } from './app.js'

//Server Configurations
const PORT = process.env.PORT || 8000

//get the package.json
import { readFile } from 'fs/promises';
const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

//Run the server
app.listen(PORT, () => {

    console.log(`${pkg.name} Server is running on port ${PORT} - ${process.env.ENVIRO} - version: ${pkg.version}`);
})

export default app;