import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RequestHandler } from 'express-serve-static-core';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mmslab406';

// 定義 JWT payload 的接口
interface JwtPayload {
    userID: string;
    userName: string;
}

// 擴展 Request 類型來包含明確類型的 user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const auth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            throw new Error('Authorization header must start with Bearer');
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload; // 使用類型斷言來確保 decoded 的類型
        req.user = decoded;
        next();
        
    } catch (error) {
        next(new Error('Invalid or expired token'));
    }
};