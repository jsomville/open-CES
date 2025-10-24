import { z } from 'zod';
import { passwordSchema } from './password.schema.js';

export const createUserSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    firstname: z.string().min(2).max(50),
    lastname: z.string().min(2).max(50),

    email: z.string().email(),
    phone: z.string().min(8).max(15),
    region: z.string().min(2).max(50),

    password: passwordSchema,
    role: z.string().min(2).max(50).optional(),
  }),
});

export const userParamSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

export const modifyUserSchema = z.strictObject({
  params: userParamSchema,
  body: z.strictObject({
    firstname: z.string().min(2).max(50),
    lastname: z.string().min(2).max(50),

    phone: z.string().min(8).max(15),
    region: z.string().min(2).max(50),
  }),
});

export const userIdSchema = z.strictObject({
  params: userParamSchema,
  body: z.strictObject({}).optional(),
});