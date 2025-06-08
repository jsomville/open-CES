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
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get Currency
// @route GET /api/currency
export const getCurrency = async (req, res, next) => {
    try {
        const currency = await prisma.currency.findUnique({ where: { id: parseInt(req.params.id) } })

        //Currency exists
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        return res.status(200).json(currency)
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}


// @desc Create Currency
// @route POST /api/currency
export const createCurrency = async (req, res, next) => {
    try {
        const symbol = req.body.symbol;
        if (!symbol || symbol.length > 6) {
            return res.status(422).json({ error: "Symbol field is requied or too long" })
        }
        const name = req.body.name;
        if (!name || name.length < 4) {
            return res.status(422).json({ error: "Name field is requied or too short" })
        }
        const country = req.body.country;
        if (!country || country.length < 2 || country.length > 3) {
            return res.status(422).json({ error: "Country field is requied 2 or 3 characters" })
        }

        //Check if Name is unique
        if (await prisma.currency.findUnique({ where: { name: name } })) {
            return res.status(409).json({ error: "Name must be unique" })
        }

        //Check if Symbol is unique
        if (await prisma.currency.findUnique({ where: { symbol: symbol } })) {
            return res.status(409).json({ error: "Symbol must be unique" })
        }

        const newCurrency = await prisma.currency.create({
            data: {
                symbol: symbol,
                name: name,
                country: country
            }
        })

        return res.status(201).json(newCurrency)
    }
    catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: error.message })
    }
}

// @desc Modify Currencies
// @route PUT /api/currency
export const updateCurrency = async (req, res, next) => {
    try {

        const symbol = req.body.symbol;
        if (!symbol || symbol.length > 6) {
            return res.status(422).json({ error: "Symbol field mandatory or too long" })
        }
        const name = req.body.name;
        if (!name || name.length < 4) {
            return res.status(422).json({ error: "Name field mandatory or too short" })
        }

        const country = req.body.country;
        if (!country || country.length < 2 || country.length > 3) {
            return res.status(422).json({ error: "Name field is requied 2 or 3 characters" })
        }

        const accountMax = req.body.accountMax;
        if (!accountMax) {
            return res.status(422).json({ error: "AccountMax field mandatory" })
        }

        //Currency exists
        if (!await prisma.currency.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "Currency not found" })
        }

        const updatedCurrency = await prisma.currency.update({
            data: {
                symbol: req.body.symbol,
                name: req.body.name,
                country: country,
                accountMax: accountMax
            },
            where: {
                id: parseInt(req.params.id)
            }
        })

        return res.status(201).json(updatedCurrency)
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Delete Currencies
// @route DELETE /api/currency
export const deleteCurrency = async (req, res, next) => {
    try {
        //Currency exists
        const currency = await prisma.currency.findUnique({ where: { id: parseInt(req.params.id) } })
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        //Balance must be zero
        if (!currency.balance === 0) {
            return res.status(422).json({ error: "Balance must be zero" })
        }

        //Get Number of Account 
        const accountCount = await prisma.account.count({
            where: {
                currencyId: parseInt(req.params.id)
            }
        })
        // Number of accounts must be zero
        if (accountCount) {
            return res.status(409).json({ error: `Currency id is being used in ${accountCount} account(s)` })
        }

        await prisma.currency.delete({
            where: {
                id: parseInt(req.params.id)
            }
        })

        return res.status(204).send()
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}
//@desc Fund account
//@route POST /api/currency/id/fundAccount
export const fundAccount = async (req, res, next) => {
    try {
        //Account is mandatory
        const accountNumber = req.body.account;
        if (!accountNumber) {
            return res.status(422).json({ error: "Account field mandatory" })
        }

        //Amount is mandatory
        if (!req.body.amount) {
            return res.status(422).json({ error: "Amount field mandatory" })
        }

        // Amount is a positive float
        const amount = Number(req.body.amount)
        if (isNaN(amount) || amount < 0) {
            return res.status(422).json({ error: "Amount must be a positive number" })
        }

        //Currency exists
        const currency = await prisma.currency.findUnique({ where: { id: parseInt(req.params.id) } })
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        // Destination account exists
        const destinationAccountNumber = parseInt(req.body.account)
        const destinationAccount = await prisma.account.findUnique({ where: { id: destinationAccountNumber } })
        if (!destinationAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Destination acount is the same currency
        if (currency.id != destinationAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        //Fund the account
        try {
            const destinationBalance = Number(destinationAccount.balance) + Number(amount);
            const currencyBalance = Number(currency.balance) - Number(amount);

            await prisma.$transaction([
                //Deduct the Currency Balance
                prisma.currency.update({
                    where: { id: currency.id },
                    data: { balance: currencyBalance }
                }),

                //Add to Destination Account
                prisma.account.update({
                    where: { id: destinationAccount.id },
                    data: { balance: destinationBalance },
                }),

                //Create Currency Transaction
                prisma.transaction.create({
                    data: {
                        accountId: destinationAccount.id,
                        amount: amount,
                        currencyId: currency.id,
                        transactionType: "Fund Account",
                        description: `From account # ${accountNumber}`,
                        status: "Completed"
                    }
                }),

                //Create user Transaction
                prisma.transaction.create({
                    data: {
                        accountId: accountNumber,
                        amount: amount,
                        currencyId: currency.id,
                        transactionType: "Fund Account",
                        description: `To account # ${destinationAccount.id}`,
                        status: "Completed"
                    }
                }),
            ])
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ error: "Fund Account Failed" })
        }

        return res.status(201).send()
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

//@desc Refund account
//@route POST /api/currency/id/refundAccount
export const refundAccount = async (req, res, next) => {
    try {
        //Account is mandatory
        const accountNumber = req.body.account;
        if (!accountNumber) {
            return res.status(422).json({ error: "Account field mandatory" })
        }

        //Amount is mandatory
        if (!req.body.amount) {
            return res.status(422).json({ error: "Amount field mandatory" })
        }

        // Amount is a positive float
        const amount = Number(req.body.amount)
        if (isNaN(amount) || amount < 0) {
            return res.status(422).json({ error: "Amount must be a positive number" })
        }

        //Currency exists
        const currency = await prisma.currency.findUnique({ where: { id: parseInt(req.params.id) } })
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        // Destination account exists
        const destinationAccountNumber = parseInt(req.body.account)
        const destinationAccount = await prisma.account.findUnique({ where: { id: destinationAccountNumber } })
        if (!destinationAccount) {
            return res.status(404).json({ error: "Destination account not found" })
        }

        //Destination acount is the same currency
        if (currency.id != destinationAccount.currencyId) {
            return res.status(422).json({ error: "Accounts must be from the same currency" })
        }

        //Amount is below of equal account balance
        if (destinationAccount.balance < amount) {
            return res.status(400).json({ error: "Insufficient funds" })
        }

        //Refund the account
        try {
            const currencyBalance = Number(currency.balance) + Number(amount);
            const destinationBalance = Number(destinationAccount.balance) - Number(amount);

            await prisma.$transaction([
                //Update Currency Balance
                prisma.currency.update({
                    where: { id: currency.id },
                    data: { balance: currencyBalance }
                }),

                //Update Account Balance
                prisma.account.update({
                    where: { id: destinationAccount.id },
                    data: { balance: destinationBalance },
                }),

                //Create a Transaction
                prisma.transaction.create({
                    data: {
                        accountId: accountNumber,
                        amount: amount,
                        currencyId: currency.id,
                        transactionType: "Refund Account",
                        description: `From account # ${destinationAccount.id}`,
                        status: "Completed"
                    }
                }),

                //Create a Transaction
                prisma.transaction.create({
                    data: {
                        accountId: destinationAccount.id,
                        amount: amount,
                        currencyId: currency.id,
                        transactionType: "Refund Account",
                        description: `To account # ${accountNumber}`,
                        status: "Completed"
                    }
                }),
            ]);
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ error: "Fund Account Failed" })
        }

        return res.status(201).send()
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

export const getCurrencyBySymbol = async (symbol) => {
    const currency = await prisma.currency.findUnique({ where: { symbol: symbol } })
    return currency;
}

