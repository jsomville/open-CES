import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Get Vouchers
// @route GET /api/voucher
export const getAllVouchers = async (req, res, next) => {
    try{
        const vouchers = await prisma.voucher.findMany()

        return res.status(200).json(vouchers);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one voucher
// @toute GET /api/voucher:id
export const getVoucher =  async(req, res, next) => {
    try{
        const voucher = await prisma.voucher.findUnique({where : {id : parseInt(req.params.id)}})

        if (!voucher){
            return res.status(404).json({ error: "Voucher Not found"})
        }
        
        return res.status(200).json(voucher);
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
    
};

// @desc Create a voucher
// @route POST /api/voucher
export const createVoucher = async (req, res, next) => {
    try{
        if (!req.body.currencyId){
            return res.status(422).json({error : "currencyId field is requied"})
        }
        if (!req.body.amount){
            return res.status(422).json({error : "amount field is requied"})
        }
        if (!req.body.duration){
            return res.status(422).json({error : "duration field is requied"})
        }

        //TODO : Generate Code
        const new_code = "abcd";

        //TODO : Balance Voucher in unclaimed currency pot...

        //Calculate the Expiration
        const days = req.body.duration;
        let expiration = new Date();
        expiration.setHours(0,0,0,0)
        expiration.setDate(expiration.getDate() + days)

        const newVoucher = await prisma.voucher.create({
            data:{
                code : new_code,
                currencyId : req.body.currencyId,
                amount : req.body.amount,
                expiration : expiration.toISOString(),
                status : "active"
            }
        })

        return res.status(201).json(newVoucher)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// @desc Modify Voucher
// @route PUT /api/voucher
export const updateVoucher = async (req, res, next) =>{
    try{
        if (!req.body.duration){
            return res.status(422).json({error : "duration field is requied"})
        }

        // Voucher exists
        if (!await prisma.voucher.findUnique({where: {id : parseInt(req.params.id)}})){
            return res.status(404).json({ error: "Voucher not found" })
        }

        //Calculate the Expiration
        const days = req.body.duration;
        let expiration = new Date();
        expiration.setHours(0,0,0,0)
        expiration.setDate(expiration.getDate() + days)

        const updatedVoucher = await prisma.voucher.update({
            data: {
                expiration : expiration
            },
            where :{
                id : parseInt(req.params.id)
            }
        })

        return res.status(201).json(updatedVoucher)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
};

// TODO : Add Function to set status for expired vouchers