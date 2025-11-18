import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';
import express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { customSwaggerOptions, swaggerConfig } from './config/openapi';
import { HttpExceptionFilter } from './middlewares/exception.filter';
import { ENVIRONMENT } from './config/configuration';
import { ErrorHandlerService } from './services/error.handler.service';
import { ConfigService } from '@nestjs/config';

let SERVICE_NAME: any;
let HOST: string;
let PORT: string | number;
let VERSION: string;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  SERVICE_NAME =
    (configService.get('APPLICATION_NAME') || 'API Gateway') +
    ' - ' +
    configService.get('environment');
  HOST = configService.get('HOST') || '0.0.0.0';
  PORT = configService.get('PORT') || 3001;
  VERSION = version || '0.0.0';
  // OWASP & Security
  app.use(
    helmet({
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true,
    }),
  );

  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);
  // Enable CORS
  app.enableCors({ credentials: true, origin: true });

  // Versioning setup
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
  });

  // OpenAPI/ Swagger setup
  app.use('/assets', express.static(join(__dirname, '..', 'assets')));

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs/api', app, document, customSwaggerOptions);

  // Validation pipelines for Request and Response validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global custom exception filter
  const errorHandlerService = app.get(ErrorHandlerService);
  app.useGlobalFilters(new HttpExceptionFilter(errorHandlerService));

  // Start the application and listen to PORT
  await app.listen(PORT, HOST, () => {
    console.log(
      `🚀 ${SERVICE_NAME} v${VERSION} - Listening on http://${
        configService.get('environment') === ENVIRONMENT.DEVELOPMENT
          ? 'localhost'
          : HOST
      }:${PORT}`,
    );
  });
}
bootstrap();

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  console.error(`💀 ${SERVICE_NAME} v${VERSION} - Killed and exiting process`);
  setTimeout(() => {
    process.exit(0);
  }, 500);
});
