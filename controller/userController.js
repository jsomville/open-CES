import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'
import { addUser, getUserById } from '../services/user_service.js';

const prisma = new PrismaClient()

// @desc Get users
// @route GET /api/user
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany()

    // Remove password hash
    const safeUsers = users.map(({ passwordHash, ...user }) => user);

    return res.status(200).json(safeUsers);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining users" })
  }
}

// @desc Get one user
// @toute GET /api/user:id
export const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Remove password hash
    const { passwordHash, ...safeUser } = user;

    return res.status(200).json(safeUser);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining user" })
  }
};

// @desc Create a User
// @route POST /api/user
export const createUser = async (req, res, next) => {
  try {

    const data = req.validatedBody;
    //Check email is unique
    const user_email = await prisma.user.findUnique({ where: { email: data.email } })
    if (user_email) {
      return res.status(409).json({ message: "Email already used" })
    }

    //Check phone is unique
    const user_phone = await prisma.user.findUnique({ where: { phone: data.phone } })
    if (user_phone) {
      return res.status(409).json({ message: "Phone already used" })
    }

    const email = data.email;
    const phone = data.phone;
    const password = data.password;
    const role = "user";
    const firstname = data.firstname;
    const lastname = data.lastname;
    const region = data.region;
    const user = await addUser(email, phone, password, role, firstname, lastname, region);

    return res.status(201).json(user)
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error adding user" })
  }
};

// @desc Modify User
// @route PUT /api/user
export const updateUser = async (req, res, next) => {
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
    const userByPhone = await prisma.user.findUnique({ where: { phone: data.phone } })
    if (userByPhone && userByPhone.id != id) {
      return res.status(409).json({ message: "Phone already used" })
    }

    const updatedUser = await prisma.user.update({
      data,
      where: {
        id: id,
      }
    })

    // Remove password hash
    const { passwordHash, ...safeUser } = updatedUser;

    return res.status(201).json(safeUser)
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

    // User exists
    if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
      return res.status(404).json({ error: "User not found" })
    }

    const updatedUser = await prisma.user.update({
      data: {
        role: "admin",
      },
      where: { id: parseInt(req.params.id) }
    })

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

    // User exists
    if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
      return res.status(404).json({ message: "User not found" })
    }

    const updatedUser = await prisma.user.update({
      data: {
        isActive: true,
      },
      where: { id: parseInt(req.params.id) }
    })

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
    // User exists
    if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
      return res.status(404).json({ message: "User not found" })
    }

    //Get Number of Account 
    const accountCount = await prisma.account.count({
      where: {
        userId: parseInt(req.params.id)
      }
    })
    // Number of accounts must be zero
    if (accountCount) {
      return res.status(409).json({ message: `User is still assigned to an account` })
    }

    //Delete user
    await prisma.user.delete({
      where: {
        id: parseInt(req.params.id)
      }
    })

    return res.status(204).send()
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting user" })
  }
};
