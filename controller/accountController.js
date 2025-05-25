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

        //Currency exists
        const currency = await prisma.currency.findUnique({where: {id : parseInt(req.body.currencyId)}})
        if (!currency){
            return res.status(404).json({ error: "Currency not found" })
        }

        //Account exist for this user and this currency
        const account = await prisma.account.findFirst({
            where: {
                userId : parseInt(req.body.userId),
                currencyId : parseInt(req.body.currencyId)
            },
        });
        if (account){
             return res.status(409).json({ error: "Account for this user and this currecny already exists" })
        }

        //Check Currency User Limit
        const accountCount = await prisma.account.count({
            where :{
                currencyId : req.body.currencyId
            }
        })
        if (accountCount >= currency.accountMax){
            return res.status(403).json({ error: "Account quota reached" })
        }

        //Create the New account
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
        console.log(error.message)
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
export const transferTo = async (req, res, next) =>{
    try{
        //Account is mandatory
        const accountNumber = req.body.account;
        if (!accountNumber){
            return res.status(422).json({error : "Account field mandatory"})
        }

        //Amount is mandatory
        if (!req.body.amount){
            return res.status(422).json({error : "Amount field mandatory"})
        }

        // Amount is a positive float
        const amount = Number(req.body.amount)
        if (isNaN(amount) || amount < 0 ){
            return res.status(422).json({error : "Amount must be a positive number"})
        }

        //Add check transfer to itself...

        //add check user on its own account only

        // Source account exists
        const sourceAccountNumber = parseInt(req.params.id)
        const sourceAccount = await prisma.account.findUnique({where : { id: sourceAccountNumber}})
        if (!sourceAccount){
            return res.status(404).json({ error: "Source account not found" })
        }

        // Destination account exists
        const destinationAccountNumber = parseInt(req.body.account)
        const destinationAccount = await prisma.account.findUnique({where : { id: destinationAccountNumber}})
        if (!destinationAccount){
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Source and Destination using the same currency
        if (sourceAccount.currencyId != destinationAccount.currencyId){
            return res.status(422).json({error : "Accounts must be from the same currency"})
        }

        //Sufficient Funds
        if (Number(sourceAccount.balance) < amount )
        {
            return res.status(400).json({ error: "Insufficient funds" })
        }

        try{
            //Create a Transaction
            const transaction = await prisma.transaction.create({
                 data:{
                    senderAccountId : sourceAccount.id,
                    receiverAccountId : destinationAccount.id,
                    amount : amount,
                    currencyId : sourceAccount.currencyId,
                    transactionType : "Transfer",
                    status : "Started"
                }
            });

            //Deduct Main Account funds
            let newBalance;
            newBalance = Number(sourceAccount.balance) - Number(amount)
            await prisma.account.update({
                where: {id : sourceAccount.id},
                data: {balance : newBalance},
            });

            //Add to Destination Account
            newBalance = Number(destinationAccount.balance) + Number(amount)
            await prisma.account.update({
                where: {id : destinationAccount.id},
                data: {balance : newBalance},
            });

            //Completed the Transaction
            await prisma.transaction.update({
                where:{
                    id : transaction.id
                },
                data:{
                    status : "Completed"
                }
            })
        }
        catch(error){
            console.log(error);

            return res.status(500).json({ error: "Transfer Failed" })
        }

        return res.status(201).send()
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
    
};

