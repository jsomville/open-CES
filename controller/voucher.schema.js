import { z } from 'zod';

export const createVoucherSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    currencyId: z.number().positive().gte(1),
    amount: z.number().positive().gte(1).lt(100000),
    duration: z.number().int().positive().gte(2).lt(1500),
  }),
});

const voucherParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyVoucherSchema = z.strictObject({
  params: voucherParamSchema,
  body: z.strictObject({
    duration: z.number().int().positive().gte(2).lt(1500),
  }),
});

export const voucherIdSchema = z.strictObject({
  params: voucherParamSchema,
  body: z.strictObject({}).optional(),
});
