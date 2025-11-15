import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 確保 DATABASE_URL 環境變數存在，如果不存在則使用 Zeabur MySQL 預設值
    const databaseUrl = process.env.DATABASE_URL ||
      'mysql://root:AqRifMe085g34vn6zXkmx29tLuwh71Gd@tpe1.clusters.zeabur.com:25823/zeabur';

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
