import '../types/express.d.ts';

import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType) : RequestHandler => {
  return (req, res, next) => {

    const result = schema.safeParse({
      params: req.params,
      body: req.body,
    });

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }

    const validated = result.data as { params?: Record<string, unknown>; body?: Record<string, unknown> };
    req.validatedParams = validated.params ?? {};
    req.validatedBody = validated.body ?? {};

    next();
  };
};