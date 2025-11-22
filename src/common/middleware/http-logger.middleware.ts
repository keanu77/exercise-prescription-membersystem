import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    const requestId = (req as any).id || 'no-id';

    // 記錄請求開始時間
    const startTime = Date.now();

    // 記錄請求資訊
    this.logger.info('HTTP Request', {
      context: 'HttpLogger',
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    // 監聽回應完成事件
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // 根據狀態碼決定日誌級別
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      this.logger.log(logLevel, 'HTTP Response', {
        context: 'HttpLogger',
        requestId,
        method,
        url: originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip,
      });
    });

    next();
  }
}
