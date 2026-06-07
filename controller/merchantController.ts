import '../types/express.d.ts';
import type { NextFunction, Request, Response } from 'express';

import { getMerchantList, getMerchantById, createMerchant, updateMerchant, deleteMerchant} from '../services/merchant_service.ts'
import { getMerchantAccounts } from '../services/account_service.ts'

// @desc Get Merchants
// @route GET /api/merchant
export const getAllMerchants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchants = await getMerchantList();

    return res.status(200).json(merchants);
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining merchants" })
  }
}

// @desc Get one merchant
// @route GET /api/merchant/:id
export const getMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.validatedParams.id as number;

    const merchant = await getMerchantById(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" })
    }

    return res.status(200).json(merchant);
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining merchant" })
  }

};

// @desc Create a Merchant
// @route POST /api/merchant
export const addMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.validatedBody;

    const newMerchant = await createMerchant(data);

    return res.status(201).json(newMerchant)
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error adding merchant" })
  }
};

// @desc Modify Merchant
// @route PUT /api/merchant
export const modifyMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const data = req.validatedBody;
    const id = req.validatedParams.id as number;

    //Merchant exists
    const merchant = await getMerchantById(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" })
    }

    const updatedMerchant = await updateMerchant(id, data);

    return res.status(201).json(updatedMerchant)
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error modifying merchant" })
  }
};

// @desc Delete a Merchant
// @route DELETE /api/merchant
export const removeMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.validatedParams.id as number;

    // Merchant exists
    const merchant = await getMerchantById(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    //Validate number of accounts must be 0
    const accounts = await getMerchantAccounts(id);
    if (accounts.length > 0) {
      return res.status(409).json({ message: `Merchant is still assigned to an account` })
    }

    //Delete merchant
    await deleteMerchant(id);

    return res.status(204).send();
  }
  catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting merchant" });
  }
};