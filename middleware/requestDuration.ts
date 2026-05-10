import type { NextFunction, Request, Response } from 'express';

function requestDuration(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint(); // High-resolution time

  const originalEnd = res.end;

  res.end = function (chunk?: any, encoding?: any, cb?: () => void) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}

export default requestDuration;