import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { getAccountByEmailAndCurrencyId } from '../services/user_service.js';
import { getVoucherById } from '../services/voucher_service.js';

const prisma = new PrismaClient();

// @desc Get Vouchers
// @route GET /api/voucher
export const getAllVouchers = async (req, res, next) => {
    try {
        const vouchers = await prisma.voucher.findMany()

        return res.status(200).json(vouchers);
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

// @desc Get one voucher
// @toute GET /api/voucher:id
export const getVoucher = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(422).json({ error: "Id required" });
        }

        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ error: "Voucher Not found" })
        }

        return res.status(200).json(voucher);
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message })
    }

};

// @desc Create a voucher
// @route POST /api/voucher
export const createVoucher = async (req, res, next) => {
    try {
        const currencyId = parseInt(req.body.currencyId);
        if (isNaN(currencyId)) {
            return res.status(422).json({ error: "currencyId field is mandatory" })
        }
        const amount = Number(req.body.amount);
        if (isNaN(amount) || amount < 0) {
            return res.status(422).json({ error: "Amount mandatory and must be a positive number" })
        }
        const duration = parseInt(req.body.duration);
        if (isNaN(duration) || duration < 0) {
            return res.status(422).json({ error: "Amount mandatory and must be a positive integer" })
        }

        //Currency exists
        const currency = await prisma.currency.findUnique({ where: { id: parseInt(currencyId) } })
        if (!currency) {
            return res.status(404).json({ error: "Currency not found" })
        }

        //Generate Unique Code
        const new_code = uuidv4()

        //Calculate the Expiration Date
        const expiration = daysFromNow(duration);

        //Create Voucher
        const newVoucher = await prisma.voucher.create({
            data: {
                code: new_code,
                currencyId: currency.id,
                amount: amount,
                expiration: expiration,
                status: "Issued",
            }
        })

        return res.status(201).json(newVoucher)
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message })
    }
};

// @desc Modify Voucher
// @route PUT /api/voucher
export const updateVoucher = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(422).json({ error: "Id required" });
        }

        const duration = parseInt(req.body.duration);
        if (isNaN(duration) || duration < 0) {
            return res.status(422).json({ error: "Amount mandatory and must be a positive integer" })
        }

        // Voucher exists
        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ error: "Voucher not found" })
        }

        //Calculate the Expiration
        const expiration = daysFrom(voucher.expiration, duration);

        // Update Expiration date
        const updatedVoucher = await prisma.voucher.update({
            data: {
                expiration: expiration
            },
            where: {
                id: parseInt(req.params.id)
            }
        })

        return res.status(201).json(updatedVoucher)
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }
};
// @desc Claim Voucher
// @route PUT /api/voucher/claim
export const claimVoucher = async (req, res, next) => {
    try {
        // Get Code
        const code = req.body.code;
        if (!code) {
            return res.status(422).json({ error: "Code is mandatory" })
        }

        // Voucher exists
        const voucher = await prisma.voucher.findUnique({ where: { code: code } });
        if (!voucher) {
            return res.status(404).json({ error: "Voucher not found" })
        }

        // Check Voucher status
        if (voucher.status !== "Issued") {
            return res.status(422).json({ error: "Voucher not available" })
        }

        // Check Voucher Expiration
        const now = new Date();
        if (now > voucher.expiration) {
            return res.status(410).json({ error: "Voucher expired" })
        }

        // Get current user account
        const email = req.user.sub;
        const account = await getAccountByEmailAndCurrencyId(email, voucher.currencyId);
        if (!account) {
            return res.status(404).json({ error: "Account not found" })
        }

        try {
            const newBalance = account.balance + voucher.amount;

            //Make the claim Transaction
            await prisma.$transaction([
                prisma.voucher.update({
                    data: {
                        status: "Claimed"
                    },
                    where: {
                        id: voucher.id
                    }
                }),
                prisma.account.update({
                    data: {
                        balance: newBalance
                    },
                    where: {
                        id: account.id
                    }
                }),
                prisma.transaction.create({
                    data: {
                        accountId: account.id,
                        amount: voucher.amount,
                        currencyId: account.currencyId,
                        transactionType: "Claim Voucher",
                        description: `Claim Voucher # ${voucher.id}`,
                        status: "Completed"
                    }
                }),
            ])

            return res.status(201).send();
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message })
        }

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message })
    }
};

export function daysFrom(date, days) {
    const future = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return future;
}

export function daysFromNow(days) {
    const now = new Date();
    const future = daysFrom(now, days);
    return future;
}