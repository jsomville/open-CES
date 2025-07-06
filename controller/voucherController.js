import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { getAccountByEmailAndCurrencyId } from '../services/user_service.js';
import { getVoucherById } from '../services/voucher_service.js';
import { getCurrencyById } from '../services/currency_service.js';

const prisma = new PrismaClient();

// @desc Get Vouchers
// @route GET /api/voucher
export const getAllVouchers = async (req, res, next) => {
    try {
        const vouchers = await prisma.voucher.findMany()

        return res.status(200).json(vouchers);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining vouchers" })
    }
}

// @desc Get one voucher
// @toute GET /api/voucher:id
export const getVoucher = async (req, res, next) => {
    try {
        const id = req.validatedParams.id;

        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher Not found" })
        }

        return res.status(200).json(voucher);
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error obtaining voucher" })
    }
};

// @desc Create a voucher
// @route POST /api/voucher
export const createVoucher = async (req, res, next) => {
    try {
        const data = req.validatedBody;

        //Currency exists
        const currency = await getCurrencyById(data.currencyId);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        //Generate Unique Code
        const new_code = uuidv4()

        //Calculate the Expiration Date
        const expiration = daysFromNow(data.duration);

        //Create Voucher
        const newVoucher = await prisma.voucher.create({
            data: {
                code: new_code,
                currencyId: data.currencyId,
                amount: data.amount,
                expiration: expiration,
                status: "Issued",
            }
        })

        return res.status(201).json(newVoucher)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error creating voucher" })
    }
};

// @desc Modify Voucher
// @route PUT /api/voucher
export const updateVoucher = async (req, res, next) => {
    try {
        const data = req.validatedBody;
        const id = req.validatedParams.id;

        // Voucher exists
        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher not found" })
        }

        //Calculate the Expiration
        const expiration = daysFrom(voucher.expiration, data.duration);

        // Update Expiration date
        const updatedVoucher = await prisma.voucher.update({
            data: {
                expiration: expiration
            },
            where: {
                id: id
            }
        })

        return res.status(201).json(updatedVoucher)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error updating voucher" })
    }
};
// @desc Claim Voucher
// @route PUT /api/voucher/claim
export const claimVoucher = async (req, res, next) => {
    try {
        // Get Code
        const code = req.body.code;
        if (!code) {
            return res.status(422).json({ message: "Code is mandatory" })
        }

        // Voucher exists
        const voucher = await prisma.voucher.findUnique({ where: { code: code } });
        if (!voucher) {
            return res.status(404).json({ message: "Voucher not found" })
        }

        // Check Voucher status
        if (voucher.status !== "Issued") {
            return res.status(422).json({ message: "Voucher not available" })
        }

        // Check Voucher Expiration
        const now = new Date();
        if (now > voucher.expiration) {
            return res.status(410).json({ message: "Voucher expired" })
        }

        // Get current user account
        const email = req.user.sub;
        const account = await getAccountByEmailAndCurrencyId(email, voucher.currencyId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" })
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
            console.error(error.message);
            return res.status(500).json({ message: "Error voucher claim" })
        }

    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error claiming voucher" })
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