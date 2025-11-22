import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判斷是否為 HTTP 異常
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 取得錯誤訊息
    let message: string | object = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorDetails = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 取得請求資訊
    const requestId = (request as any).id || 'no-id';
    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    // 建立錯誤回應
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: originalUrl,
      method,
      message,
      requestId,
      ...(process.env.NODE_ENV !== 'production' && errorDetails && { details: errorDetails }),
    };

    // 記錄錯誤
    const logContext = {
      context: 'HttpExceptionFilter',
      requestId,
      method,
      url: originalUrl,
      statusCode: status,
      ip,
      userAgent,
      error: exception instanceof Error ? exception.stack : String(exception),
    };

    if (status >= 500) {
      // 伺服器錯誤：記錄為 error 級別
      this.logger.error('Server Error', logContext);
    } else if (status >= 400) {
      // 客戶端錯誤：記錄為 warn 級別
      this.logger.warn('Client Error', logContext);
    }

    // 回應錯誤
    response.status(status).json(errorResponse);
  }
}
