import { z } from 'zod';

export const createVoucherSchema = z.strictObject({
    currencyId: z.number().positive().gte(1),
    amount: z.number().positive().gte(1).lt(100000),
    duration: z.number().positive().gte(2).lt(1500),
});

export const modifyVoucherSchema = z.strictObject({
    duration: z.number().positive().gte(2).lt(1500),
});