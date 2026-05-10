import type { NextFunction, Request, Response } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.status){
        res.status(err.status).json({msg : err.message});
    }
    else{
        res.status(500).json({msg : err.message});
    }
    next();
};

export default errorHandler;