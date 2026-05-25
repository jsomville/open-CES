import "../types/express.d.ts";
import type { NextFunction, Request, Response } from "express";

import {
  createUser,
  getUserByEmail,
  getUserByPhone,
  setEmailVerifiedAtByEmail,
  setPhoneVerifiedAtByEmail,
  setUserStatusByEmail,
} from "../services/user_service.ts";

import {
  generateCode,
  createValidationChallenge,
  deleteExpiredValidationChallenges,
  validateCode,
} from "../services/validation_challenge_service.ts";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.validatedBody as {
      email: string;
      phone: string;
      password: string;
      firstname: string;
      lastname: string;
    };

    //Cleanup Expired Challenges
    await deleteExpiredValidationChallenges();

    // Check if user already exists
    let existingUser: any;
    existingUser = await getUserByEmail(data.email);
    if (existingUser && existingUser.status !== "ACTIVE") {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    existingUser = await getUserByPhone(data.phone);
    if (existingUser && existingUser.status !== "ACTIVE") {
      return res
        .status(409)
        .json({ message: "User with this phone number already exists" });
    }

    //Create the user
    const user = await createUser(
      data.email,
      data.phone,
      data.password,
      "user",
      data.firstname,
      data.lastname,
    );

    //Expires in 10 minutes
    const expiredDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Make the email Challenge
    const emailCode = await generateCode();
    await createValidationChallenge(
      "email",
      user.email,
      emailCode,
      expiredDate,
    );

    //Make the sms Challenge
    const smsCode = await generateCode();
    await createValidationChallenge("sms", user.email, smsCode, expiredDate);

    return res.status(200).json({
      message:
        "User registration request created, please check your email and SMS for validation codes.",
    });
  } catch (error: unknown) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error submitting user registration" });
  }
};

export const validateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.validatedBody as {
      email: string;
      code: string;
      channel: string;
    };

    //Cleanup Expired Challenges
    await deleteExpiredValidationChallenges();

    // Get the registration request
    const validated = await validateCode(data.email, data.channel, data.code);
    if (!validated) {
      return res.status(404).json({ message: "Invalid Challenge" });
    }

    if (data.channel === "email") {
      await setEmailVerifiedAtByEmail(data.email);
    } else if (data.channel === "sms") {
      await setPhoneVerifiedAtByEmail(data.email);
    }

    const user = await getUserByEmail(data.email);
    if (user) {
      if (user.emailVerifiedAt && user.phoneVerifiedAt) {
        await setUserStatusByEmail(data.email, "ACTIVE");

        return res
          .status(200)
          .json({ message: "Registration validated successfully" });
      }
      return res
        .status(200)
        .json({ message: "Challenge validated, waiting for other channel" });
    }
    else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error validating registration" });
  }
};
