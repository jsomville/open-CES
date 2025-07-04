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
    console.error(error);
    return res.status(500).json({ message: "Error obtaining merchants" })
  }
}

// @desc Get one merchant
// @toute GET /api/merchant:id
export const getMerchant = async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: parseInt(req.params.id) } })

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" })
    }

    return res.status(200).json(merchant);
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obtaining merchant" })
  }

};

// @desc Create a Merchant
// @route POST /api/merchant
export const createMerchant = async (req, res, next) => {
  try {

    const data = req.validatedData;

    const newMerchant = await prisma.merchant.create({ data });

    return res.status(201).json(newMerchant)
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error adding merchant" })
  }
};

// @desc Modify Merchant
// @route PUT /api/merchant
export const updateMerchant = async (req, res, next) => {
  try {

    const data = req.validatedData;

    // User exists
    if (!await prisma.merchant.findUnique({ where: { id: parseInt(req.params.id) } })) {
      return res.status(404).json({ message: "Merchant not found" })
    }

    const updatedMerchant = await prisma.merchant.update({
      data,
      where: {
        id: parseInt(req.params.id)
      }
    })

    return res.status(201).json(updatedMerchant)
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error modifying merchant" })
  }
};

// @desc Delete a Merchant
// @route DELETE /api/merchant
export const deleteMerchant = async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id);

    // User exists
    if (!await prisma.merchant.findUnique({ where: { id: merchantId } })) {
      return res.status(404).json({ message: "Merchant not found" })
    }

    //Validate number of accoutn must be 0
    const accountCount = await prisma.account.count({
      where: { merchantId: merchantId }
    })
    if (accountCount) {
      return res.status(409).json({ message: `Merchant is still assigned to an account` })
    }

    //Demete user
    await prisma.merchant.delete({
      where: {
        id: merchantId
      }
    })

    return res.status(204).send()
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting merchant" })
  }

};