import { z } from 'zod';

export const createMerchantSchema = z.strictObject({
  name: z.string().min(4).max(255),
  email: z.string().email(),
  phone: z.string().min(2).max(15),
  region: z.string().max(255),
});

export const modifyMerchantSchema = z.strictObject({
  name: z.string().min(4).max(255),
  email: z.string().email(),
  phone: z.string().min(2).max(15),
  region: z.string().max(255),
});