"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const nest_winston_1 = require("nest-winston");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = app.get(nest_winston_1.WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(logger));
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Server is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
    logger.log(`🔒 Security: Helmet enabled`, 'Bootstrap');
    logger.log(`🚦 Rate Limiting: Enabled (100 req/min, login: 5 req/min)`, 'Bootstrap');
    logger.log(`📊 Logging: Winston enabled (logs in ./logs)`, 'Bootstrap');
    logger.log(`🔍 Exception Filter: Enabled`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map