import { z } from 'zod';
import { passwordSchema } from './password.schema.ts';

export const loginSchema = z.strictObject({
  params: z.strictObject({}).optional(),
  body: z.strictObject({
    username: z.email(),
    password: passwordSchema,
  }),
});

export const emptyApiSchema = z.object({
  params: z.object({}).strict().optional(),
  body: z.object({}).strict().optional(),
}).strict();

export const refreshApiSchema = z.object({
  params: z.object({}).strict().optional(),
  body: z.strictObject({
    refreshToken: z.string(),
  }),
}).strict();