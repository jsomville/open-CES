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
            return res.status(422).json({error : "userId field mandatory"})
        }
        if (!req.body.currencyId){
            return res.status(422).json({error : "currencyId field mandatory"})
        }
        if (!req.body.accountType){
            return res.status(422).json({error : "accountType field mandatory"})
        }

        const newAccount = await prisma.account.create({
            data:{
                userId : parseInt(req.body.userId),
                currencyId : parseInt(req.body.currencyId),
                accountType : parseInt(req.body.accountType)
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
        // Account exists
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

// @desc Transfer to an Account
// @route POST /api/account/id/transfer
/*export const transfer = async (req, res, next) =>{
    try{
        //Destination account is mandatory
        const accountNumber = req.body.account;
        if (!accountNumber){
            return res.status(422).json({error : "Account field is requied"})
        }

        //Amount is mandatory
        const amount = req.body.amount;
        if (!amount){
            return res.status(422).json({error : "Amount field is requied"})
        }

        // Source account exists
        const destinationaccount = await prisma.account.findUnique({where : { id: parseInt(req.params.id)}})
        if (!destinationaccount){
            return res.status(404).json({ error: "Destination account not found" })
        }

        // Source account exists
        const sourceaccount = await prisma.account.findUnique({where : { id: parseInt(req.params.id)}})
        if (!sourceaccount){
            return res.status(404).json({ error: "Source account not found" })
        }

        //Amount is required



        //Balance in source account positive
        if (account.balance > 0 )
        {
            return res.status(409).json({ error: "Balance must be zero" })
        }

        //Destination account exists

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
    
};*/

