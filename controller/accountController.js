import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Get Account
// @route GET /api/account
export const getAllAccount = async (req, res, next) => {
    try{
        const accounts = await prisma.account.findMany()
        return res.status(200).json(accounts);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one account
// @toute GET /api/account:id
export const getAccount =  async(req, res, next) => {
    try{
        const account = await prisma.account.findUnique({where : {id : parseInt(req.params.id)}})

        if (!account){
            return res.status(404).json({ error: "Account not found" })
        }
        
        return res.status(200).json(account);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// @desc Create Account
// @route POST /api/account
export const createAccount = async (req, res, next) => {
    try{

        if (!req.body.userId){
            return res.status(422).json({error : "userId field is requied"})
        }
        if (!req.body.currencyId){
            return res.status(422).json({error : "currencyId field is requied"})
        }

        const newAccount = await prisma.account.create({
            data:{
                userId : req.body.userId,
                currencyId : req.body.currencyId,
            }
        })

        return res.status(201).json(newAccount)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// @desc Delete a Account
// @route DELETE /api/account
export const deleteAccount = async (req, res, next) =>{
    try{
        // User exists
        const account = await prisma.account.findUnique({where : { id: parseInt(req.params.id)}})
        if (!account){
            return res.status(404).json({ error: "Account not found" })
        }

        //Balance at zero
        if (account.balance > 0 )
        {
            return res.status(409).json({ error: "Balance must be zero" })
        }

        //Delete account
        await prisma.account.delete({
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
