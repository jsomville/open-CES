import { z } from 'zod';

export const createAccountSchema = z.strictObject({
    params: z.strictObject({}).optional(),
    body: z.strictObject({
        userId: z.number().min(1),
        currencyId: z.number().min(1),
        accountType: z.number().min(0),
    })

});

export const accountParamSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
});

export const accountIdSchema = z.strictObject({
    params: accountParamSchema,
    body: z.strictObject({}).optional(),
});

export const accountTransferSchema = z.strictObject({
    params: accountParamSchema,
    body: z.strictObject({
        account: z.number().int().min(1),
        amount: z.number().positive(),
        description: z.string().max(255).optional()
    })
});