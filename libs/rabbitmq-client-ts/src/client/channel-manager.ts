import * as amqplib from 'amqplib';
import { ConnectionManager } from './connection-manager';
import { IRabbitMQClientProps } from '../types';

export class ChannelManager {
  private pool: amqplib.Channel[] = [];
  private maxPoolSize: number;

  constructor(
    private connectionManager: ConnectionManager,
    maxPoolSize: IRabbitMQClientProps['maxPoolSize'] = 10,
  ) {
    this.maxPoolSize = maxPoolSize;
  }

  async initializePool() {
    const connection = this.connectionManager.getConnection();
    for (let i = 0; i < this.maxPoolSize; i++) {
      const channel = await this.createChannelWithListeners(connection);
      this.pool.push(channel);
    }
  }
  async borrowChannel(callback?: () => void): Promise<amqplib.Channel> {
    let channel: amqplib.Channel;

    if (this.pool.length > 0) {
      channel = this.pool.pop()!;
    } else {
      await this.initializePool();
      channel = this.pool.pop()!;
    }

    // If a callback is provided, set it as an additional listener
    if (callback) {
      channel.on('error', (err) => {
        console.error('Channel error:', err);
        callback();
      });

      channel.on('close', () => {
        console.warn('Channel closed.');
        callback();
      });
    }

    return channel;
  }

  returnChannel(channel: amqplib.Channel, producer = false) {
    if (channel?.connection) {
      if (this.pool.length < this.maxPoolSize && !producer) {
        this.pool.push(channel);
      } else {
        channel.close().catch(console.error);
      }
    } else {
      console.warn('Discarding closed or invalid channel.');
    }
  }

  async closeAllChannels() {
    while (this.pool.length) {
      const channel = this.pool.pop();
      if (channel) {
        await channel.close();
      }
    }
  }

  private async createChannelWithListeners(
    connection: amqplib.Connection,
  ): Promise<amqplib.Channel> {
    const channel = await connection.createChannel();

    const handleChannelError = (err: Error) => {
      console.error('Channel error:', err);
      this.recreateAndPushChannel(connection, channel).catch(console.error);
    };

    channel.on('error', handleChannelError);

    return channel;
  }

  private async recreateAndPushChannel(
    connection: amqplib.Connection,
    oldChannel: amqplib.Channel,
  ): Promise<void> {
    this.pool = this.pool.filter((ch) => ch !== oldChannel);

    try {
      const newChannel = await this.createChannelWithListeners(connection);
      this.pool.push(newChannel);
    } catch (error) {
      console.error('Failed to recreate channel:', error);
    }
  }
}
