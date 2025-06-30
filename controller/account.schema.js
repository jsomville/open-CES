import { z } from 'zod';

export const createAccountSchema = z.strictObject({
    userId: z.number().min(1),
    currencyId: z.number().min(1),
    accountType: z.number().min(0),
});