import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // 🔐 環境變數驗證 Schema
      validationSchema: Joi.object({
        // 必要欄位
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),

        // 伺服器設定
        PORT: Joi.number().default(3001),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        // CORS 設定
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        CORS_CREDENTIALS: Joi.boolean().default(true),

        // JWT 設定
        JWT_EXPIRES_IN: Joi.string().default('1d'),

        // 安全設定
        BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(10),

        // 其他設定
        API_PREFIX: Joi.string().default('api/v1'),
        LOG_LEVEL: Joi.string()
          .valid('debug', 'info', 'warn', 'error')
          .default('info'),
        TZ: Joi.string().default('Asia/Taipei'),
      }),
      validationOptions: {
        allowUnknown: true, // 允許其他未定義的環境變數
        abortEarly: false,   // 顯示所有驗證錯誤，不只第一個
      },
    }),
    // Rate Limiting 配置
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 時間窗口：60秒
      limit: 100,  // 每個窗口最多 100 個請求（一般 API）
    }]),
    PrismaModule,
    AuthModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全域啟用 Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
