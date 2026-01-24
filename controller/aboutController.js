import { getSimpleCurrencyList } from '../services/currency_service.js';

export const getMobileAppVersion = async (req, res, next) => {
  try {
    const mobileAppVersion = process.env.MOBILE_APP_VERSION || "0.0.0";
    return res.status(200).json({ mobileAppVersion });
  }
  catch (error) {
    console.error(error.message);
    
    return res.status(500).json({ message: "Error obtaining mobile app version" })
  }
}

export const getCurrencies = async (req, res, next) => {
  try {
    const currencies =  await getSimpleCurrencyList()

    return res.status(200).json({ currencies });
  }
  catch (error) {
    console.error(error.message);
    
    return res.status(500).json({ message: "Error obtaining currencies" })
  }
}