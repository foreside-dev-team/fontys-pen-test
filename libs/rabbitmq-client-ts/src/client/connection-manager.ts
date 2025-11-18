import * as amqplib from 'amqplib';
import {
  GenericError,
  IRabbitMQClientProps,
  type IRabbitMQClientCredentialsProps,
} from '../types';
import { EventEmitter } from 'events';
import { genericErrorHandler } from '../utils';
import * as fs from 'fs';

export class ConnectionManager extends EventEmitter {
  private connection: amqplib.Connection | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private currentHostIndex = 0;

  constructor(
    private readonly hosts: IRabbitMQClientProps['hosts'],
    private readonly secure: IRabbitMQClientProps['secure'],
    private readonly port: IRabbitMQClientProps['port'],
    private readonly credentials: IRabbitMQClientCredentialsProps,
    maxReconnectAttempts: IRabbitMQClientProps['maxReconnectAttempts'] = 10,
  ) {
    super();
    this.maxReconnectAttempts = Array.isArray(this.hosts)
      ? maxReconnectAttempts * this.hosts.length
      : maxReconnectAttempts;
  }

  async createConnection(vhost = '/'): Promise<amqplib.Connection> {
    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      try {
        if (!this.connection) {
          const currentHost = Array.isArray(this.hosts)
            ? this.hosts[this.currentHostIndex]
            : this.hosts;

          if (
            this.secure &&
            (!this.credentials.certPath ||
              !this.credentials.keyPath ||
              !this.credentials.caPath ||
              !this.credentials.passphrase)
          ) {
            throw new GenericError(
              400,
              'Missing credentials for secure connection to RabbitMQ.',
              [
                {
                  message:
                    'Secure connection requires certPath, keyPath, and caPath.',
                  type: 'RabbitMQClientError',
                  name: 'RabbitMQClientError',
                },
              ],
            );
          }

          const credentials = this.secure
            ? amqplib.credentials.external()
            : {
                username: this.credentials.username,
                password: this.credentials.password,
              };

          const socketOptions = this.secure
            ? {
                cert: this.credentials.certPath
                  ? await fs.promises.readFile(this.credentials.certPath)
                  : undefined,
                key: this.credentials.keyPath
                  ? await fs.promises.readFile(this.credentials.keyPath)
                  : undefined,
                ca: this.credentials.caPath
                  ? [await fs.promises.readFile(this.credentials.caPath)]
                  : undefined,
                passphrase: this.credentials.passphrase,
                credentials,
                rejectUnauthorized: false,
              }
            : { rejectUnauthorized: false };

          this.connection = await amqplib.connect(
            {
              hostname: currentHost,
              protocol: this.secure ? 'amqps' : 'amqp',
              port: this.port ?? (this.secure ? 5671 : 5672),
              vhost,
              ...(!this.secure ? credentials : {}),
            },
            socketOptions,
          );

          console.log(
            'RabbitMQ connection initialized for: ',
            currentHost,
            vhost,
          );

          this.emit('connected');
          this.setupConnectionErrorHandling(vhost);
          this.reconnectAttempts = 0;
        }
        return this.connection;
      } catch (error) {
        this.reconnectAttempts += 1;
        this.currentHostIndex =
          (this.currentHostIndex + 1) %
          (Array.isArray(this.hosts) ? this.hosts.length : 1);
        console.error(
          `Error establishing RabbitMQ connection to ${this.hosts[this.currentHostIndex]}, attempt ${this.reconnectAttempts}: `,
          error,
        );

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          throw genericErrorHandler({
            statusCode: 500,
            message:
              'Max reconnect attempts reached. Could not establish RabbitMQ connection.',
            path: 'connectionManager',
          });
        }

        console.log(
          `Retrying to connect to RabbitMQ in 5 seconds... (Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts})`,
        );
        await this.delay(5000);
      }
    }

    throw genericErrorHandler({
      statusCode: 500,
      message: 'Failed to establish RabbitMQ connection after max retries',
      path: 'connectionManager',
    });
  }

  private setupConnectionErrorHandling(vhost: string) {
    this.connection?.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      this.connection = null;
      this.reconnectAttempts = 0;
      this.emit('closed');
      this.reconnect(vhost);
    });

    this.connection?.on('close', () => {
      console.warn('RabbitMQ connection closed. Attempting to reconnect...');
      this.connection = null;
      this.reconnectAttempts = 0;
      this.emit('closed');
      this.reconnect(vhost);
    });

    this.connection?.on('blocked', (reason) => {
      console.warn(`RabbitMQ connection blocked: ${reason}`);
    });

    this.connection?.on('disconnect', (err) => {
      console.error('RabbitMQ connection disconnected:', err);
    });
  }

  private reconnect(vhost: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        'Max reconnect attempts reached. Not attempting further reconnections.',
      );
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.tryReconnect(vhost).catch((error) => {
        console.error('Error reconnecting to RabbitMQ: ', error);
        this.reconnect(vhost);
      });
    }, 5000);
  }

  private async tryReconnect(vhost: string): Promise<void> {
    try {
      await this.createConnection(vhost);
      console.log('Reconnected to RabbitMQ.');
    } catch (error) {
      console.error('Reconnection failed:', error);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached. Reconnection aborted.');
      } else {
        this.reconnect(vhost);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConnection(): amqplib.Connection {
    if (!this.connection) {
      throw new Error('RabbitMQ connection not established.');
    }
    return this.connection;
  }
}
