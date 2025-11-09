import { z } from 'zod';
import { AccountType, isValidAccountType } from '../utils/accountUtil.js';

export const createAccountSchema = z.strictObject({
    params: z.strictObject({}).optional(),
    body: z.strictObject({
        userId: z.number().min(1),
        currencyId: z.number().min(1),
        accountType: z.number().refine(isValidAccountType, {
            message: `Account type must be one of: ${Object.entries(AccountType).map(([k, v]) => `${k}=${v}`).join(', ')}`
        }),
    })

});

export const accountParamSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
});

export const accountIdSchema = z.strictObject({
    params: accountParamSchema,
    body: z.strictObject({}).optional(),
});

export const accountIdTransactionPageSchema = z.strictObject({
    params: accountParamSchema,
    body: z.strictObject({}).optional(),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional(),
});

export const accountTransferSchema = z.strictObject({
    params: accountParamSchema,
    body: z.strictObject({
        account: z.number().int().min(1),
        amount: z.number().positive(),
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
