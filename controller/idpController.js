
// @desc Login
// @toute POST /api/idp/login
export const login = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    res.status(200).send("Login")
}

// @desc Logout
// @toute POST /api/idp/logout
export const logout = (req, res, next) => {
    const token = req.body.token;

    res.status(200).send("Logout")
}