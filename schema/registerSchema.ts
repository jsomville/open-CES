import { z } from 'zod';
import { passwordSchema } from './password.schema.ts';

export const registerSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    firstname: z.string().min(2).max(50),
    lastname: z.string().min(2).max(50),

    email: z.email(),
    phone: z.string().min(8).max(15),

    password: passwordSchema,
  }),
});

export const registerChallengeSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    email: z.email(),
    channel: z.enum(["email", "sms"]),
    code: z.string().min(6).max(6),
  }),
});