import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 📊 使用 Winston Logger 作為應用預設 logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // 🔍 設定全域異常過濾器
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // 🔒 安全標頭中間件（Helmet）
  // 防護常見的 Web 漏洞：XSS、點擊劫持、MIME 類型嗅探等
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // 允許跨域嵌入（視需求調整）
  }));

  // 啟用全域驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 啟用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // 從環境變數讀取，開發環境預設為 localhost
    credentials: true,
  });

  // 設定全域 API 前綴
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // 使用 Winston logger 輸出啟動訊息
  logger.log(`🚀 Server is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(`🔒 Security: Helmet enabled`, 'Bootstrap');
  logger.log(`🚦 Rate Limiting: Enabled (100 req/min, login: 5 req/min)`, 'Bootstrap');
  logger.log(`📊 Logging: Winston enabled (logs in ./logs)`, 'Bootstrap');
  logger.log(`🔍 Exception Filter: Enabled`, 'Bootstrap');
}
bootstrap();
