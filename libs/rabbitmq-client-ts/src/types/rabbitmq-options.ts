import {
  IRabbitMQPublishProps,
  RabbitMQConsumeOpts,
  RabbitMQPublishOpts,
  ValidationOptions,
} from '.';
import type { MessageProperties, MessagePropertyHeaders } from 'amqplib';

export interface IMessageProperties extends MessageProperties {
  contentType: string;
  contentEncoding: string;
  headers: MessagePropertyHeaders;
  deliveryMode: number;
  priority: number;
  correlationId: string;
  replyTo: string;
  expiration: string;
  messageId: string;
  timestamp: string;
  type: string;
  userId: string;
  appId: string;
  clusterId: string;
}

export class RabbitMQOpts<TData, TResponse> {
  messageOptions!:
    | RabbitMQPublishOpts<TData>
    | RabbitMQConsumeOpts<TData, TResponse>;
  validationOptions!: ValidationOptions<TData, TResponse>;
  opts?: IRabbitMQPublishProps;
}
