import { IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import * as amqplib from 'amqplib';

export type RpcHandler<TData, TResponse> = (
  content: TData,
  properties: amqplib.MessageProperties,
) => Promise<TResponse>;

export enum ExchangeType {
  Direct = 'direct',
  Topic = 'topic',
  Headers = 'headers',
  Fanout = 'fanout',
  Match = 'match',
}
/**
 * Represents the properties for the RabbitMQ handler.
 * @template T - The type of the payload body.
 */
export class RabbitMQPublishOpts<TData> {
  @IsObject()
  @Type(() => Object)
  payload!: TData;

  @IsString()
  routingKey!: string;

  @IsString()
  exchange!: string;
}

export class RabbitMQConsumeOpts<TData, TResponse> {
  @IsObject()
  @Type(() => Object)
  handler!: RpcHandler<TData, TResponse>;

  @IsString()
  routingKey!: string;

  @IsString()
  exchange!: string;

  @IsString()
  exchangeType?: ExchangeType = ExchangeType.Direct;
}
