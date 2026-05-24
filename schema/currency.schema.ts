import { z } from 'zod';

import { isValidAccountId } from '../utils/accountUtil.ts';

export const createCurrencySchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    symbol: z.string().min(1).max(6),
    name: z.string().min(4).max(255),
    country: z.string().min(2).max(5),
    regionList: z.string().min(0).max(1024).optional(),
    logoURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    webSiteURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    newAccountWizardURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    topOffWizardURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    androidAppURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    iphoneAppURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    androidAppLatestVersion: z.string().max(10).optional().or(z.literal('').transform(() => undefined)),
    iphoneAppLatestVersion: z.string().max(10).optional().or(z.literal('').transform(() => undefined)),
  }),
});

const currencyParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyCurrencySchema = z.strictObject({
  params: currencyParamSchema,
  body: z.strictObject({
    country: z.string().min(2).max(5).optional(),
    regionList: z.string().min(0).max(1024).optional(),
    logoURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
    webSiteURL: z.url().max(1024).optional().or(z.literal('').transform(() => undefined)),
  })
});

export const currencyIdSchema = z.strictObject({
  params: currencyParamSchema,
  body: z.strictObject({}).optional(),
});

export const currencyFundRefundSchema = z.strictObject({
  params: currencyParamSchema,
  body: z.strictObject({
    number: z.string().refine(isValidAccountId, {
      error: "Invalid account number format"
    }),
    amount: z.number().positive(),
  }),
});

