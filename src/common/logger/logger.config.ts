import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

// 自訂日誌格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// 終端機輸出格式（開發環境使用）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace, requestId }) => {
    const contextStr = context ? `[${context}]` : '';
    const requestIdStr = requestId ? `[${requestId}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp} ${level} ${contextStr}${requestIdStr} ${message}${traceStr}`;
  }),
);

// 日誌輪替配置（每日輪替，保留 30 天）
const dailyRotateFileTransport: DailyRotateFile = new DailyRotateFile({
  dirname: 'logs',
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat,
});

// 錯誤日誌輪替
const errorRotateFileTransport: DailyRotateFile = new DailyRotateFile({
  dirname: 'logs',
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: customFormat,
});

// HTTP 請求日誌輪替
const httpRotateFileTransport: DailyRotateFile = new DailyRotateFile({
  dirname: 'logs',
  filename: 'http-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat,
});

// Winston 模組配置
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // 終端機輸出（開發環境）
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    // 一般日誌檔案（輪替）
    dailyRotateFileTransport,
    // 錯誤日誌檔案（輪替）
    errorRotateFileTransport,
    // HTTP 請求日誌檔案（輪替）
    httpRotateFileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};
