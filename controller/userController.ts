import '../types/express.d.ts'; 
import type { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';

import { getUserList, createUser, updateUser, deleteUser, getUserById, getUserByEmail, getUserByPhone, setUserAdminById, setActiveUserById } from '../services/user_service.ts';
import { getUserAccounts } from '../services/account_service.ts';


// @desc Get users
// @route GET /api/user
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getUserList()

    return res.status(200).json(users);
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining users" })
  }
}

// @desc Get one user
// @route GET /api/user/:id
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.validatedParams.id as number;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json(user);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining user" })
  }
};

// @desc Create a User
// @route POST /api/user
export const addUser = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const data = req.validatedBody as { email: string; phone: string; password: string; firstname: string; lastname: string};

    //Check email is unique
    const userEmail = await getUserByEmail(data.email);
    if (userEmail) {
      return res.status(409).json({ message: "Email already used" })
    }

    //Check phone is unique
    const userPhone = await getUserByPhone(data.phone);
    if (userPhone) {
      return res.status(409).json({ message: "Phone already used" })
    }

    const role = "user";
    const passwordHash = await argon2.hash(data.password);

    const user = await createUser(data.email, data.phone, passwordHash, role, data.firstname, data.lastname);

    //Activate user
    await setActiveUserById(user.id);

    return res.status(201).json(user)
  }
  catch (error : unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error adding user" })
  }
};

// @desc Modify User
// @route PUT /api/user
export const modifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.validatedBody as { email?: string; phone?: string; password?: string; firstname?: string; lastname?: string };
    const id = req.validatedParams.id as number;

    // User exists
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // User - Allow to modify self
    if (req.user.role == "user") {
      if (req.user.sub != user.email) {
        return res.status(403).json({ message: "Forbidden: Insufficient role" })
      }
    }

    //Check phone is unique and not self
    if (data.phone) {
      const userByPhone = await getUserByPhone(data.phone);
      if (userByPhone && userByPhone.id != id) {
        return res.status(409).json({ message: "Phone already used" })
      }
    }

    const updatedUser = await updateUser(id, data);

    return res.status(201).json(updatedUser)
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error modifying user" })
  }
};

// @desc set user admin
// @route PUT /api/user/id/set-admin
export const setUserAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const userId = req.validatedParams.id as number;

    // User exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    await setUserAdminById(userId);

    return res.status(204).send()
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error setting user admin" })
  }
}

// @desc Set user active
// @route PUT /api/user/:id/set-active
export const setUserActive = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const userId = req.validatedParams.id as number;

    //User exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await setActiveUserById(userId);

    return res.status(204).send()
  }
  catch (error : unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error activating user" })
  }
}

// @desc Delete a User
// @route DELETE /api/user
export const removeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.validatedParams.id as number;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    //Get Number of Account
    const accountCount = await getUserAccounts(userId);
    if (accountCount.length > 0) {
      return res.status(409).json({ message: `User is still assigned to an account` })
    }

    //Delete user
    await deleteUser(userId);

    return res.status(204).send()
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting user" })
  }
};
