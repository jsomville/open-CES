import { z } from 'zod';

export const createCurrencySchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    symbol: z.string().min(1).max(6),
    name: z.string().min(4).max(255),
    country: z.string().min(2).max(5),
    accountMax: z.number().int().min(100).optional(),
    regionList: z.string().min(0).max(1024).optional(),
    logoURL: z.string().url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    webSiteURL: z.string().url().max(1024).optional().or(z.literal('').transform(() => undefined)),
  }),
});

export const currencyParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyCurrencySchema = z.strictObject({
  params: currencyParamSchema,
  body: z.strictObject({
    country: z.string().min(2).max(5),
    accountMax: z.number().int().min(100).optional(),
    regionList: z.string().min(0).max(1024).optional(),
    logoURL: z.string().url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    webSiteURL: z.string().url().max(1024).optional().or(z.literal('').transform(() => undefined)),
  })
});

export const currencyIdSchema = z.strictObject({
  params: currencyParamSchema,
  body: z.strictObject({}).optional(),
});

