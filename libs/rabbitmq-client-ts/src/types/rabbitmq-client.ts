import type { IRabbitMQClientCredentialsProps } from './rabbitmq-credentials';
import type { IRabbitMQPublishProps } from './rabbitmq-publish';

/**
 * Represents the properties required to create a RabbitMQClient.
 */
export interface IRabbitMQClientProps {
  hosts: string[] | string;
  secure?: boolean;
  port?: number;
  credentials: IRabbitMQClientCredentialsProps;
  maxReconnectAttempts?: number;
  maxPoolSize?: number;
  prefetch?: number;
  publishOpts?: IRabbitMQPublishProps;
}
