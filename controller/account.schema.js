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

export const accountInfoByEmail= z.strictObject({
    params: z.strictObject({}).optional(),
    body: z.strictObject({
        email: z.string().email(),
        symbol: z.string().min(1).max(6),
    })
});

export const accountInfoByPhone= z.strictObject({
    params: z.strictObject({}).optional(),
    body: z.strictObject({
        phone: z.string().min(8).max(15),
        symbol: z.string().min(1).max(6),
    })
});
