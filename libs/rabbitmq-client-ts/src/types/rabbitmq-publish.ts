import type { Options } from "amqplib";

export interface IRabbitMQPublishProps extends Options.Publish {
  replyTo?: string;
  correlationId?: string;
}
