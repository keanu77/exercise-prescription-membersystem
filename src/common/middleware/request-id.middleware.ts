import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 從標頭讀取現有的 request ID，或生成新的
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // 將 request ID 附加到請求物件
    req.id = requestId;

    // 將 request ID 加入回應標頭
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
