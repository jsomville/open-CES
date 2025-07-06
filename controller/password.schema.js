import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Must include at least one uppercase letter',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Must include at least one lowercase letter',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Must include at least one number',
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: 'Must include at least one special character',
  })
  .refine((val) => !/\s/.test(val), {
    message: 'Password must not contain spaces',
  });