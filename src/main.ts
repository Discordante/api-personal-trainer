// src/main.ts
import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

function getLogLevels(nodeEnv?: string): LogLevel[] {
  // Keep logs lean in production; verbose in local/development
  if (nodeEnv === 'production' || nodeEnv === 'staging') {
    return ['error', 'warn', 'log'];
  }
  return ['error', 'warn', 'log', 'debug', 'verbose'];
}

async function bootstrap() {
  // Buffer early logs and set levels from env
  const levels = getLogLevels(process.env.NODE_ENV);
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: levels,
  });

  // Use Nest logger instance everywhere
  const logger = new Logger('Bootstrap');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  // Global env-driven config
  const config = app.get(ConfigService);
  const globalPrefix = config.get<string>('API_GLOBAL_PREFIX')!;
  const docsPath = config.get<string>('DOCS_PATH')!;
  const port = config.get<number>('PORT')!;

  app.setGlobalPrefix(globalPrefix);

  // Swagger (fixed metadata as requested)
  const openapi = new DocumentBuilder()
    .setTitle('Personal Trainer API')
    .setDescription('REST API for Personal Trainer')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, openapi);
  SwaggerModule.setup(docsPath, app, document, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: true,
  });

  // Global process-level error handlers (so they hit Nest logger)
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error(`Unhandled Promise Rejection: ${String(reason)}`);
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught Exception: ${err.message}`, err.stack);
  });

  try {
    await app.listen(port);
    const base = await app.getUrl();
    logger.log(`Listening on ${base}/${globalPrefix}`);
    logger.log(`Swagger UI at ${base}/${globalPrefix}/${docsPath}`);
  } catch (err) {
    logger.error('Failed to start application', (err as Error).stack);
    process.exitCode = 1;
  }
}

bootstrap();
