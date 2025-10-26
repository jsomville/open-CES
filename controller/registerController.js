
import argon2 from 'argon2';
import { addUserRegistration, getUserRegistrationByEmail, getUserRegistrationByCode, deleteUserRegistrationById} from '../services/register_service.js';
import nodemailer from 'nodemailer';
import { addUser, getUserByEmail } from '../services/user_service.js';

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

    // Generate a code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create Registration in DB
    await addUserRegistration(
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
    await sendValidationEmail(data.email, code);

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

    // Create User
    await addUser(registration.email, registration.phone, registration.passwordHash, "user", registration.firstname, registration.lastname, registration.region);

    //Create Account
    
    // Activate User
     
    // Delete registration after validation
    await deleteUserRegistrationById(registration.id);

    return res.status(200).json({ message: "Registration validated successfully" })
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error validating registration" })
  }
}
