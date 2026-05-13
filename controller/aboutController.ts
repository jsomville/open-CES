import type { NextFunction, Request, Response } from 'express';

import { getSimpleCurrencyList } from '../services/currency_service.ts';

export const getMobileAppVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mobileAppVersion = process.env.MOBILE_APP_VERSION || "0.0.0";
    return res.status(200).json({ mobileAppVersion });
  }
  catch (error : unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    
    return res.status(500).json({ message: "Error obtaining mobile app version" })
  }
}

export const getCurrencies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currencies =  await getSimpleCurrencyList()

    return res.status(200).json({ currencies });
  }
  catch (error : unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    
    return res.status(500).json({ message: "Error obtaining currencies" })
  }
}