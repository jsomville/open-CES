import { z } from 'zod';
import { passwordSchema } from './password.schema.js';

export const registerSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    firstname: z.string().min(2).max(50),
    lastname: z.string().min(2).max(50),

    email: z.string().email(),
    phone: z.string().min(8).max(15),
    region: z.string().min(2).max(50),

    password: passwordSchema,
    
    symbol: z.string().min(1).max(6),
  }),
});

export const registerValidationSchema = z.strictObject({
  params: z.strictObject({
    code: z.string().min(6).max(6),
  }),
  body: z.strictObject({}).optional(),
});
