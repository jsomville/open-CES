import { z } from 'zod';

export const createMerchantSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    name: z.string().min(4).max(255),
    email: z.string().email(),
    phone: z.string().min(2).max(15),
    region: z.string().max(255),
  })
});

const merchantParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyMerchantSchema = z.strictObject({
  params: merchantParamSchema,
  body: z.strictObject({
    name: z.string().min(4).max(255),
    email: z.string().email(),
    phone: z.string().min(2).max(15),
    region: z.string().max(255),
  })
});

export const merchentIdSchema = z.strictObject({
  params: merchantParamSchema,
  body: z.strictObject({}).optional(),
});
