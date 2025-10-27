
import { addUserRegistration, getUserRegistrationByEmail, getUserRegistrationByCode, deleteUserRegistrationById} from '../services/register_service.js';
import nodemailer from 'nodemailer';
import { addUser, getUserByEmail, setActiveUser} from '../services/user_service.js';
import { createAccount } from '../services/account_service.js';
import { getCurrencyBySymbol } from '../services/currency_service.js';
import { doFundAccount } from '../services/currency_service.js';

// Create transporter outside for reuse
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PWD
  }
});

const sendValidationEmail = async (toEmail, code) => {

  const header = '<H1>Welcome to Zinne Brussels</H1></br>';
  const welcome = `<p>Your confirmation code is <b>${code}</b></p>/br>`;
  const thankYou = '<p>Thank you for registering!</p>';

  const msg = header + welcome + thankYou;

  await transporter.sendMail({
    from: '"No-Reply" <no-reply@zinne.brussels>',
    to: toEmail,
    subject: `Your Email Confirmation Code is ${code}`,
    text: "Your Email confirmation code is " + code,
    html: msg

  });
}

export const register = async (req, res, next) => {
  try {
    const data = req.validatedBody;

    // Check if registration already exists
    const existingUser = await getUserRegistrationByEmail(data.email);
    if (existingUser) {
      return res.status(409).json({ message: "Registration already exists" });
    }

    // Check if user already exists
    const user = await getUserByEmail(data.email);
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }

    // get Currency
    const currency = await getCurrencyBySymbol(data.symbol);
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" });
    }

    // Generate a code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create Registration in DB
    const registration = await addUserRegistration(
      data.email,
      data.phone,
      data.password,
      data.firstname,
      data.lastname,
      data.region,
      code,
      data.symbol
    );

    //Send Email with code
    //await sendValidationEmail(data.email, code);
    //https://docs.railway.com/reference/outbound-networking#debugging-smtp-issues

    //TEMP BECAUSE MAIL DOSENT WORK
     // Create User
    const newUser = await addUser(registration.email, registration.phone, registration.passwordHash, "user", registration.firstname, registration.lastname, registration.region);
    if (!newUser) {
      return res.status(500).json({ message: "Error creating user" });
    }

    // Activate User
    await setActiveUser(newUser.id);

    //Create Account
    const accountType = 1; // TO FIX
    const account = await createAccount(newUser.id, currency.id, accountType);
    if (!account) {
      return res.status(500).json({ message: "Error creating account" });
    }

    // *****************************
    // Temp fund account
    // *****************************
    await doFundAccount(currency, account, 10);

    // Delete registration after validation
    await deleteUserRegistrationById(registration.id);

    return res.status(200).json({ message: "Registration successful, check your email for the confirmation code" });
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error registering user" })
  }
}

export const validateRegistration = async (req, res, next) => {
  try {
    const code = req.validatedParams.code;

    const registration = await getUserRegistrationByCode(code);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // get Currency
    const currency = await getCurrencyBySymbol(registration.symbol);
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" });
    }

    // Create User
    const newUser = await addUser(registration.email, registration.phone, registration.passwordHash, "user", registration.firstname, registration.lastname, registration.region);
    if (!newUser) {
      return res.status(500).json({ message: "Error creating user" });
    }

    // Activate User
    await setActiveUser(newUser.id);

    //Create Account
    const accountType = 1; // TO FIX
    const account = await createAccount(newUser.id, currency.id, accountType);
    if (!account) {
      return res.status(500).json({ message: "Error creating account" });
    }

    // Delete registration after validation
    await deleteUserRegistrationById(registration.id);

    return res.status(200).json({ message: "Registration validated successfully" })
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error validating registration" })
  }
}
