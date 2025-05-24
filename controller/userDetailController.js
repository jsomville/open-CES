import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const transactionPerAccount = 5

// @desc Get one user
// @toute GET /api/user:id
export const getUserDetail =  async(req, res, next) => {
    try{
        const user = await prisma.user.findUnique({where : {email : req.params.email}});
        if (!user){
            return res.status(404).json({ error: "User not found"})
        }
        // Remove password hash
        const { passwordHash, ...safeUser } = user;

        const accounts = await prisma.account.findMany({where : {userId : user.id}});
        console.log(accounts);
        console.log("***");
        for (const account of accounts){
            console.log(account);
            const latestTransactions = await prisma.transaction.findMany({
                where : {senderAccountId : account.id},
                orderBy :{ createdAt: 'desc'},
                take: transactionPerAccount,
            });
            if (latestTransactions){
                account.latestTransactions = latestTransactions;
            }
        }
        

        const userDetail = {
            ...safeUser,
            accounts : accounts.map(account => ({
                ...account,
            }))
        }
        
        return res.status(200).json(userDetail);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};