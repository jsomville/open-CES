import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Get Currencies
// @route GET /api/currency
export const getAllCurrencies = async (req, res, next) => {
    try { 
        const currencies = await prisma.currency.findMany()

        // Remove Balance in list of Currencies
        const safeCurrency = currencies.map(({ balance, ...currencies }) => currencies);

        return res.status(200).json(safeCurrency)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get Currency
// @route GET /api/currency
export const getCurrency = async (req, res, next) => {
    try { 
        const currency = await prisma.currency.findUnique( {where : {id : parseInt(req.params.id)}})

        //Currency exists
        if (!currency){
            return res.status(404).json({ error: "Currency not found" })
        }

        return res.status(200).json(currency)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}


// @desc Create Currency
// @route POST /api/currency
export const createCurrency = async (req, res, next) => {
    try { 
        const symbol = req.body.symbol;
        if (!symbol || symbol.length > 6){
            return res.status(422).json({error : "Symbol field is requied or too long"})
        }
        const name = req.body.name;
        if (!name || name.length < 4){
            return res.status(422).json({error : "Name field is requied or too short"})
        }
        const country = req.body.country;
        if (!country || country.length < 2 || country.length > 3){
            return res.status(422).json({error : "Country field is requied 2 or 3 characters"})
        }

        //Check if Name is unique
        if (await prisma.currency.findUnique({where: {name : name}})){
            return res.status(409).json({ error: "Name must be unique" })
        }

        //Check if Symbol is unique
        if (await prisma.currency.findUnique({where: {symbol : symbol}})){
            return res.status(409).json({ error: "Symbol must be unique" })
        }

        const newCurrency = await prisma.currency.create({
            data:{
                symbol: symbol,
                name: name,
                country : country
            }
        })

        return res.status(201).json(newCurrency)
    }
    catch(error){
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
}

// @desc Modify Currencies
// @route PUT /api/currency
export const updateCurrency = async (req, res, next) => {
    try {

        const symbol = req.body.symbol;
        if (!symbol || symbol.length > 6){
            return res.status(422).json({error : "Symbol field mandatory or too long"})
        }
        const name = req.body.name;
        if (!name || name.length < 4){
            return res.status(422).json({error : "Name field mandatory or too short"})
        }

        const country = req.body.country;
        if (!country || country.length < 2 || country.length > 3){
            return res.status(422).json({error : "Name field is requied 2 or 3 characters"})
        }

        //Currency exists
        if (!await prisma.currency.findUnique({where: {id : parseInt(req.params.id)}})){
            return res.status(404).json({ error: "Currency not found" })
        }

        const updatedCurrency = await prisma.currency.update({
            data: {
                symbol : req.body.symbol,
                name : req.body.name,
                country : country
            },
            where :{
                id : parseInt(req.params.id)
            }
        })

        return res.status(201).json(updatedCurrency)
    }
    catch(error){
        return res.status(500).json({ error: error.message })
    }
}

// @desc Delete Currencies
// @route DELETE /api/currency
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

