export default class LogHelper {

    static async logError(msg, req) {
        if (process.env.ENVIRO == "DEV") {
            //Log multiline
            console.error(`Error ${msg}`);
            console.error(`    ${req.method} ${req.url} `);
            console.error(`    ${req.ip} ${req.user.sub}`);
        }
        else {
            //log single line
            console.error()
        }
    }

}
