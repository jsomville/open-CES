import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Create Currency
// @toute POST /api/currency
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
// @toute GET /api/currency
export const getAllCurrencies = async (req, res, next) => {
    try { 
        const currencies = await prisma.currency.findMany()

        return res.status(200).json(currencies)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

