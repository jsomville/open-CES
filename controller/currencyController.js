import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Create Currency
// @route POST /api/currency
export const createCurrency = async (req, res, next) => {
    try { 
        if (!req.body.symbol){
            return res.status(422).json({error : "Symbol field is requied"})
        }
        if (!req.body.name){
            return res.status(422).json({error : "Name field is requied"})
        }

        const newCurrency = await prisma.currency.create({
            data:{
                symbol: req.body.symbol,
                name: req.body.name
            }
        })

        return res.status(201).json(newCurrency)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get Currencies
// @route GET /api/currency
export const getAllCurrencies = async (req, res, next) => {
    try { 
        const currencies = await prisma.currency.findMany()

        return res.status(200).json(currencies)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Modify Currencies
// @route PUT /api/currency
export const updateCurrency = async (req, res, next) => {
    try {
        //Currency exists
        if (!await prisma.currency.findUnique({where: {id : parseInt(req.params.id)}})){
            return res.status(404).json({ error: "Currency not found" })
        }
        //Symbol is required
        if (!req.body.symbol){
            return res.status(422).json({error : "Symbol field is requied"})
        }
        //Name is required
        if (!req.body.name){
            return res.status(422).json({error : "Name field is requied"})
        }

        const updatedCurrency = await prisma.currency.update({
            data: {
                symbol : req.body.symbol,
                name : req.body.name,
            },
            where :{
                id : parseInt(req.params.id)
            }
        })

        return res.status(200).json(updatedCurrency)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Delete Currencies
// @route Delete /api/currency
export const deleteCurrency = async (req, res, next) => {
    try {
        //Currency exists
        const currency = await prisma.currency.findUnique({where: {id : parseInt(req.params.id)}})
        if (!currency){
            return res.status(404).json({ error: "Currency not found" })
        }

        //Balance must be zero
        if (!currency.balance === 0){
            return res.status(422).json({error : "Balance must be zero"})
        }
         
        //Get Number of Account 
        const accountCount  = await prisma.account.count({
            where: {
                currencyId: parseInt(req.params.id)
            }
        })
        // Number of accounts must be zero
        if (accountCount){
            return res.status(409).json({ error: `Currency id is being used in ${accountCount} account(s)` })
        }

        await prisma.currency.delete({
            where :{
                id : parseInt(req.params.id)
            }
        })

        return res.status(204).send()
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

