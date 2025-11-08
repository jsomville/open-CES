import argon2 from 'argon2';

import { getUserList, createUser, updateUser, removeUser, getUserById, getUserByEmail, getUserByPhone, setUserAdminById, setActiveUserById } from '../services/user_service.js';
import { getAccountCountByUserId } from '../services/account_service.js';


// @desc Get users
// @route GET /api/user
export const getAllUsers = async (req, res, next) => {
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
export const getUser = async (req, res, next) => {
  try {
    const userId = req.validatedParams.id;

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
export const addUser = async (req, res, next) => {
  try {

    const data = req.validatedBody;

    //Check email is unique
    const user_email = await getUserByEmail(data.email);
    if (user_email) {
      return res.status(409).json({ message: "Email already used" })
    }

    //Check phone is unique
    const user_phone = await getUserByPhone(data.phone);
    if (user_phone) {
      return res.status(409).json({ message: "Phone already used" })
    }

    const role = "user";
    const hashedPassword = await argon2.hash(data.password);

    const user = await createUser(data.email, data.phone, hashedPassword, role, data.firstname, data.lastname, data.region);

    return res.status(201).json(user)
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error adding user" })
  }
};

// @desc Modify User
// @route PUT /api/user
export const modifyUser = async (req, res, next) => {
  try {
    const data = req.validatedBody;
    const id = req.validatedParams.id;

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
    const userByPhone = await getUserByPhone(data.phone);
    if (userByPhone && userByPhone.id != id) {
      return res.status(409).json({ message: "Phone already used" })
    }

    const updatedUser = await updateUser(id, data);

    return res.status(201).json(updatedUser)
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error modifying user" })
  }
};

// @desc set user admin
// @route PUT /api/user/id/set-admin
export const setUserAdmin = async (req, res, next) => {
  try {

    const userId = req.validatedParams.id;

    // User exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    await setUserAdminById(userId);

    return res.status(204).send()
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error setting user admin" })
  }
}

// @desc Set user active
// @route PUT /api/user/:id/set-active
export const setUserActive = async (req, res, next) => {
  try {

    const userId = req.validatedParams.id;

    //User exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await setActiveUserById(userId);

    return res.status(204).send()
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error activating user" })
  }
}

// @desc Delete a User
// @route DELETE /api/user
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.validatedParams.id;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    //Get Number of Account
    const accountCount = await getAccountCountByUserId(userId);

    if (accountCount) {
      return res.status(409).json({ message: `User is still assigned to an account` })
    }

    //Delete user
    await removeUser(userId);

    return res.status(204).send()
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting user" })
  }
};
