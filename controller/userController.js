import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
//test

// @desc Get users
// @route GET /api/user
export const getAllUsers = async (req, res, next) => {
    try{
        const users = await prisma.user.findMany()

        // Remove password hash
        const safeUsers = users.map(({ passwordHash, ...user }) => user);

        return res.status(200).json(safeUsers);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one user
// @toute GET /api/user:id
export const getUser =  async(req, res, next) => {
    try{
        const user = await prisma.user.findUnique({where : {id : parseInt(req.params.id)}})

        if (!user){
            return res.status(404).json({ error: "User Not found"})
        }

        // Remove password hash
        const { passwordHash, ...safeUser } = user;
        
        return res.status(200).json(safeUser);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
    
};

// @desc Create a User
// @route POST /api/user
export const createUser = async (req, res, next) => {
    try{
        if (!req.body.firstname){
            return res.status(422).json({error : "firstname field is requied"})
        }
        if (!req.body.lastname){
            return res.status(422).json({error : "lastname field is requied"})
        }
        if (!req.body.email){
            return res.status(422).json({error : "email field is requied"})
        }
        if (!req.body.phone){
            return res.status(422).json({error : "phone field is requied"})
        }
        if (!req.body.region){
            return res.status(422).json({error : "region field is requied"})
        }
        const password = req.body.password
        if (!password || password.lenght < 10){
            return res.status(422).json({error : "password field is requied"})
        }

        //TODO : Check email is unique

        //TODO : Hash the password
        const passwordHashed = await argon2.hash(password);

        //TODO : confirm email

        //TODO : Confirm Phone


        const newUser = await prisma.user.create({
            data:{
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                phone : req.body.phone,
                region : req.body.region,
                passwordHash : passwordHashed,
                role : "user"
            }
        })

        // Remove password hash
        const { passwordHash, ...safeUser } = newUser;

        return res.status(201).json(safeUser)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// @desc Modify User
// @route PUT /api/user
export const updateUser = async (req, res, next) =>{
    try{
        //TODO: Remove Password hash

        if (!req.body.firstname){
            return res.status(422).json({error : "firstname field is requied"})
        }
        if (!req.body.lastname){
            return res.status(422).json({error : "lastname field is requied"})
        }
        if (!req.body.phone){
            return res.status(422).json({error : "phone field is requied"})
        }
        if (!req.body.region){
            return res.status(422).json({error : "region field is requied"})
        }

        // User exists
        if (!await prisma.user.findUnique({where: {id : parseInt(req.params.id)}})){
            return res.status(404).json({ error: "User not found" })
        }

        const updatedUser = await prisma.user.update({
            data: {
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                phone : req.body.phone,
                region : req.body.region
            },
            where :{
                id : parseInt(req.params.id)
            }
        })

        // Remove password hash
        const { passwordHash, ...safeUser } = newUser;

        return res.status(201).json(safeUser)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// @desc Delete a User
// @route DELETE /api/user
export const deleteUser = async (req, res, next) =>{
    try{
        // User exists
        if (!await prisma.user.findUnique({where : { id: parseInt(req.params.id)}})){
            return res.status(404).json({ error: "User not found" })
        }

        //Get Number of Account 
        const accountCount  = await prisma.account.count({
            where: {
                userId: parseInt(req.params.id)
            }
        })
        // Number of accounts must be zero
        if (accountCount){
            return res.status(409).json({ error: `User is still assigned to an account` })
        }

        //Delete user
        await prisma.user.delete({
            where:{
                id : parseInt(req.params.id)
            }
        })

        return res.status(204).send()
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
    
};