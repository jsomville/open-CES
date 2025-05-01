import app from './app.js'

//Server Configurations
const VERSION = process.version
const PORT = process.env.PORT || 8000

//Run the server
app.listen(PORT, () => {
    let environement = "in DEV";
    if (process.env.ENVIRO === "PRD"){
        environement = "in production";
    }

    console.log (`Server is running on port ${PORT} ${environement}`);
})

export default app;