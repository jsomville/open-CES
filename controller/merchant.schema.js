import { z } from 'zod';

export const createMerchantSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    name: z.string().min(4).max(255),
    region: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().min(2).max(15).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    website: z.string().url().max(255).optional(),
    address: z.string().max(512).optional(),
  })
});

const merchantParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyMerchantSchema = z.strictObject({
  params: merchantParamSchema,
  body: z.strictObject({
    name: z.string().min(4).max(255),
    region: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().min(2).max(15).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    website: z.string().url().max(255).optional(),
    address: z.string().max(512).optional(),
  })
});

export const merchantIdSchema = z.strictObject({
  params: merchantParamSchema,
  body: z.strictObject({}).optional(),
});
