import express from "express";

declare global {
  namespace Express {
    interface Request {
      validatedParams: Record<string, unknown>;
      validatedBody: Record<string, unknown>;
      user: {
        sub: string;
        role: string;
      };
    }
  }
}