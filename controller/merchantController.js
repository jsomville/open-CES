import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @desc Get Merchants
// @route GET /api/merchant
export const getAllMerchant = async (req, res, next) => {
    try {
        const merchants = await prisma.merchant.findMany()

        return res.status(200).json(merchants);
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one merchant
// @toute GET /api/merchant:id
export const getMerchant = async (req, res, next) => {
    try {
        const merchant = await prisma.merchant.findUnique({ where: { id: parseInt(req.params.id) } })

        if (!merchant) {
            return res.status(404).json({ error: "merchant not found" })
        }

        return res.status(200).json(merchant);
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }

};

// @desc Create a Merchant
// @route POST /api/merchant
export const createMerchant = async (req, res, next) => {
    try {
        if (!req.body.name) {
            return res.status(422).json({ error: "Name field mandatory" })
        }
        if (!req.body.email) {
            return res.status(422).json({ error: "Email field mandatory" })
        }
        if (!req.body.phone) {
            return res.status(422).json({ error: "Phone field mandatory" })
        }
        if (!req.body.region) {
            return res.status(422).json({ error: "Region field mandatory" })
        }

        const newMerchant = await prisma.merchant.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                region: req.body.region
            }
        })

        return res.status(201).json(newMerchant)
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
};

// @desc Modify Merchant
// @route PUT /api/merchant
export const updateMerchant = async (req, res, next) => {
    try {
        if (!req.body.name) {
            return res.status(422).json({ error: "Name field mandatory" })
        }
        if (!req.body.email) {
            return res.status(422).json({ error: "Email field mandatory" })
        }
        if (!req.body.phone) {
            return res.status(422).json({ error: "Phone field mandatory" })
        }
        if (!req.body.region) {
            return res.status(422).json({ error: "Region field mandatory" })
        }

        // User exists
        if (!await prisma.merchant.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "Merchant not found" })
        }

        const updatedMerchant = await prisma.merchant.update({
            data: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                region: req.body.region
            },
            where: {
                id: parseInt(req.params.id)
            }
        })

        return res.status(201).json(updatedMerchant)
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
};

// @desc Delete a Merchant
// @route DELETE /api/merchant
export const deleteMerchant = async (req, res, next) => {
    try {
        // User exists
        if (!await prisma.merchant.findUnique({ where: { id: parseInt(req.params.id) } })) {
            return res.status(404).json({ error: "Merchant not found" })
        }

        //Get Number of Account 
        const accountCount = await prisma.account.count({
            where: {
                merchantId: parseInt(req.params.id)
            }
        })
        // Number of accounts must be zero
        if (accountCount) {
            return res.status(409).json({ error: `Merchant is still assigned to an account` })
        }

        //Demete user
        await prisma.merchant.delete({
            where: {
                id: parseInt(req.params.id)
            }
        })

        return res.status(204).send()
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }

};