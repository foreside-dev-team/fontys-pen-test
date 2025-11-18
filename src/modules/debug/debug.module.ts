import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DebugController } from './debug.controller';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [DebugController],
})
export class DebugModule {}
