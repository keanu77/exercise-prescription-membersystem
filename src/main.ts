import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 啟用全域驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 啟用 CORS
  app.enableCors({
    origin: 'http://localhost:5173', // Vue 開發伺服器位址
    credentials: true,
  });

  // 設定全域 API 前綴
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
