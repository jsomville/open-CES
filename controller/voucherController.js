import { v4 as uuidv4 } from 'uuid';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { getUserByEmail } from '../services/user_service.js';
import { getUserAccounts } from '../services/account_service.js';
import { getVouchers, getVoucherById, getVoucherByCode, createVoucher, updateVoucher, claimVoucherService, VoucherStatus } from '../services/voucher_service.js';
import { getCurrencyById } from '../services/currency_service.js';


// @desc Get Vouchers
// @route GET /api/voucher
export const getAllVouchers = async (req, res, next) => {
    try {
        const vouchers = await getVouchers();

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
export const addVoucher = async (req, res, next) => {
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
        const newVoucher = await createVoucher(new_code, data.amount, data.currencyId, expiration);

        return res.status(201).json(newVoucher)
    }
    catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Error creating voucher" })
    }
};

// @desc Modify Voucher
// @route PUT /api/voucher
export const modifyVoucher = async (req, res, next) => {
    try {
        const data = req.validatedBody;
        const id = req.validatedParams.id;

        // Voucher exists
        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher not found" })
        }

        if (voucher.status !== VoucherStatus.ISSUED) {
            return res.status(422).json({ message: "Voucher not modifiable" })
        }

        //Calculate the Expiration
        const expiration = daysFrom(voucher.expiration, data.duration);

        // Update Expiration date
        const updatedVoucher = await updateVoucher(id, expiration);

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
        const code = req.validatedBody.code;

        // Voucher exists
        const voucher = await getVoucherByCode(code);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher not found" })
        }

        // Check Voucher status
        if (voucher.status !== VoucherStatus.ISSUED) {
            return res.status(422).json({ message: "Voucher not available" })
        }

        // Check Voucher Expiration
        const now = new Date();
        if (now > voucher.expiration) {
            return res.status(410).json({ message: "Voucher expired" })
        }

        // Get current user account
        const email = req.user.sub;
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        //get User Accounts
        const accounts = await getUserAccounts(user.id);
        if (accounts.length == 0) {
            return res.status(404).json({ message: "No Account found" });
        }

        // Check if user has an account in this currency
        const account = accounts.find(account => account.currencyId === voucher.currencyId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        //Make the claim Transaction
        await claimVoucherService(voucher, account);

        return res.status(201).send();

    }
    catch (error) {
        console.error(error);
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