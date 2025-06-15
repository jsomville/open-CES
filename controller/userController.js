import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'
import { addUser } from '../services/user_service.js';

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
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one user
// @toute GET /api/user:id
export const getUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // Remove password hash
        const { passwordHash, ...safeUser } = user;

        return res.status(200).json(safeUser);
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
};

// @desc Create a User
// @route POST /api/user
export const createUser = async (req, res, next) => {
    try {
        const firstname = req.body.firstname;
        if (!firstname) {
            return res.status(422).json({ error: "Firstname field mandatory" })
        }
        const lastname = req.body.lastname;
        if (!lastname) {
            return res.status(422).json({ error: "Lastname field mandatory" })
        }
        const email = req.body.email;
        if (!email) {
            return res.status(422).json({ error: "Email field mandatory" })
        }
        const phone = req.body.phone;
        if (!phone) {
            return res.status(422).json({ error: "Phone field mandatory" })
        }
        const region = req.body.region;
        if (!region) {
            return res.status(422).json({ error: "Region field mandatory" })
        }
        const password = req.body.password
        if (!password) {
            return res.status(422).json({ error: "Password field mandatory" })
        }
        if (password.length < 10) {
            return res.status(422).json({ error: "Invalid Password policy" })
        }

        //Check email is unique
        const user_email = await prisma.user.findUnique({ where: { email: req.body.email } })
        if (user_email) {
            return res.status(409).json({ error: "Email already used" })
        }

        //Check phone is unique
        const user_phone = await prisma.user.findUnique({ where: { phone: req.body.phone } })
        if (user_phone) {
            return res.status(409).json({ error: "Phone already used" })
        }

        const role = "user";
        const user = await addUser(email, phone, password, role, firstname, lastname, region);

        return res.status(201).json(user)
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message })
    }
};

// @desc Modify User
// @route PUT /api/user
export const updateUser = async (req, res, next) => {
    try {
        if (!req.body.firstname) {
            return res.status(422).json({ error: "Firstname field mandatory" })
        }
        if (!req.body.lastname) {
            return res.status(422).json({ error: "Lastname field mandatory" })
        }
        if (!req.body.phone) {
            return res.status(422).json({ error: "Phone field mandatory" })
        }
        if (!req.body.region) {
            return res.status(422).json({ error: "Region field mandatory" })
        }

        //TODO : Allow modification of self

        // User exists
        if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "User not found" })
        }

        //Check phone is unique and not self
        const user_phone = await prisma.user.findUnique({ where: { phone: req.body.phone } })
        if (user_phone && user_phone.id != req.params.id) {
            return res.status(409).json({ error: "Phone already used" })
        }

        const updatedUser = await prisma.user.update({
            data: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                phone: req.body.phone,
                region: req.body.region
            },
            where: {
                id: parseInt(req.params.id)
            }
        })

        // Remove password hash
        const { passwordHash, ...safeUser } = updatedUser;

        return res.status(201).json(safeUser)
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message })
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
        return res.status(500).json({ error: error.message })
    }
}

// @desc Set user active
// @route PUT /api/user/:id/set-active
export const setUserActive = async (req, res, next) => {
    try {

        // User exists
        if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "User not found" })
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
        return res.status(500).json({ error: error.message })
    }
}

// @desc Delete a User
// @route DELETE /api/user
export const deleteUser = async (req, res, next) => {
    try {
        // User exists
        if (!await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "User not found" })
        }

        //Get Number of Account 
        const accountCount = await prisma.account.count({
            where: {
                userId: parseInt(req.params.id)
            }
        })
        // Number of accounts must be zero
        if (accountCount) {
            return res.status(409).json({ error: `User is still assigned to an account` })
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
        return res.status(500).json({ error: error.message })
    }
};
