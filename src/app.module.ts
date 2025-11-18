import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from './modules/database/database.module';
import configuration from './config/configuration';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';
import { ErrorHandlerService } from './services/error.handler.service';
import { AppController } from './app.controller';
import { DebugModule } from './modules/debug/debug.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/assets',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('throttler.ttl'),
          limit: configService.get('throttler.limit'),
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    HealthcheckModule,
    OrdersModule,
    RabbitmqModule,
    DebugModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ErrorHandlerService,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
