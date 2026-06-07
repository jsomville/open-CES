import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { getUserByEmail } from '../services/user_service.ts';
import { getUserAccounts } from '../services/account_service.ts';
import { getVouchers, getVoucherById, getVoucherByCode, createVoucher, updateVoucher, claimVoucherService, VoucherStatus } from '../services/voucher_service.ts';
import { getCurrencyById } from '../services/currency_service.ts';


// @desc Get Vouchers
// @route GET /api/voucher
export const getAllVouchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vouchers = await getVouchers();

        return res.status(200).json(vouchers);
    }
    catch (error : unknown) {
        console.error(error);
        return res.status(500).json({ message: "Error obtaining vouchers" })
    }
}

// @desc Get one voucher
// @route GET /api/voucher/:id
export const getVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.validatedParams.id as number;

        const voucher = await getVoucherById(id);
        if (!voucher) {
            return res.status(404).json({ message: "Voucher Not found" })
        }

        return res.status(200).json(voucher);
    }
    catch (error : unknown) {
        console.error(error);
        return res.status(500).json({ message: "Error obtaining voucher" })
    }
};

// @desc Create a voucher
// @route POST /api/voucher
export const addVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.validatedBody as { amount: number; currencyId: number; duration: number};

        //Currency exists
        const currency = await getCurrencyById(data.currencyId);
        if (!currency) {
            return res.status(404).json({ message: "Currency not found" })
        }

        //Generate Unique Code
        const newCode = uuidv4()

        //Calculate the Expiration Date
        const expiration = daysFromNow(data.duration);

        //Create Voucher
        const newVoucher = await createVoucher(newCode, data.amount, data.currencyId, expiration);

        return res.status(201).json(newVoucher)
    }
    catch (error : unknown) {
        console.error(error);
        return res.status(500).json({ message: "Error creating voucher" })
    }
};

// @desc Modify Voucher
// @route PUT /api/voucher
export const modifyVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.validatedBody as { duration: number };
        const id = req.validatedParams.id as number;

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
    catch (error : unknown) {
        console.error(error);
        return res.status(500).json({ message: "Error updating voucher" })
    }
};
// @desc Claim Voucher
// @route PUT /api/voucher/claim
export const claimVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Code
        const code = req.validatedBody.code as string;

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
    catch (error : unknown) {
        console.error(error);
        return res.status(500).json({ message: "Error claiming voucher" })
    }
};

export function daysFrom(date: Date, days: number): Date {
    const future = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return future;
}

export function daysFromNow(days: number): Date {
    const now = new Date();
    const future = daysFrom(now, days);
    return future;
}