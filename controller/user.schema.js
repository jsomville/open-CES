import { z } from 'zod';

export const createUserSchema = z.strictObject({
  firstname: z.string().min(4).max(255),
  lastname: z.string().min(4).max(255),

  email: z.string().email(),
  phone: z.string().min(2).max(15),
  region: z.string().max(255),

  password: z.string().min(8).max(255),
  role: z.string().min(2).max(255).optional(),
});

export const modifyUserSchema = z.strictObject({
  firstname: z.string().min(4).max(255),
  lastname: z.string().min(4).max(255),

  phone: z.string().min(2).max(15),
  region: z.string().max(255),

})