import * as amqplib from 'amqplib';
import { randomUUID } from 'crypto';
import {
  type IRabbitMQClientProps,
  GenericError,
  RabbitMQOpts,
  RabbitMQPublishOpts,
  IRabbitMQPublishProps,
  RabbitMQConsumeOpts,
  ValidationOptions,
  IMessageProperties,
  ExchangeType,
  IRabbitMQClientCredentialsProps,
} from '../types';
import {
  genericErrorHandler,
  generateBuffer,
  isGenericError,
  parseBufferOrString,
} from '../utils';
import { validateAndTransform } from '../validator';
import { ChannelManager } from './channel-manager';
import { ConnectionManager } from './connection-manager';
import { plainToInstance } from 'class-transformer';
import { EventEmitter } from 'events';

const DEFAULT_EXPIRATION = 5000;

/**
 * Represents a RabbitMQ client that manages connections, channels, and message processing.
 */
export class RabbitMQClient extends EventEmitter {
  private connectionManager: ConnectionManager;
  private channelManager!: ChannelManager;
  prefetch: number;
  secure: boolean;
  hosts: string | string[];
  port: number;
  maxReconnectAttempts = 10;
  maxPoolSize = 10;
  credentials: IRabbitMQClientCredentialsProps;
  state: 'connected' | 'closed' = 'closed';
  constructor({
    hosts,
    secure = false,
    port = 5672,
    prefetch = 10,
    maxReconnectAttempts = 10,
    credentials,
  }: IRabbitMQClientProps) {
    super();
    if (
      !hosts ||
      (Array.isArray(hosts) && hosts.length === 0) ||
      !credentials
    ) {
      throw genericErrorHandler({
        statusCode: 400,
        message: 'Missing required parameters',
        details: [
          {
            message: 'URL and Credentials are required',
            type: 'RabbitMQClientError',
            name: 'RabbitMQClientError',
          },
        ],
      });
    }
    this.secure = secure;
    this.prefetch = prefetch;
    this.hosts = hosts;
    this.credentials = credentials;
    this.port = port;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.connectionManager = new ConnectionManager(
      this.hosts,
      this.secure,
      this.port,
      this.credentials,
      this.maxReconnectAttempts,
    );
    this.channelManager = new ChannelManager(
      this.connectionManager,
      this.maxPoolSize,
    );
    //this.setupConnectionListener();
  }

  async initialize(vhost: string): Promise<void> {
    try {
      await this.connectionManager.createConnection(vhost);
    } catch (error) {
      if (!isGenericError(error as object)) {
        throw genericErrorHandler({
          statusCode: 404,
          message: 'Error initializing RabbitMQClient',
          path: 'initialize',
        });
      }
      throw error;
    }
  }

  async setupQueue(
    exchange: string,
    routingKey: string,
    exchangeType: ExchangeType = ExchangeType.Direct,
  ) {
    const queueName = `${exchange}.${routingKey}`;

    if (!this.channelManager || this.state !== 'connected') {
      throw genericErrorHandler({
        statusCode: 424,
        message: 'RabbitMQClient not initialized',
      });
    }
    const channel = await this.channelManager.borrowChannel();
    try {
      // Assert the exchange
      await channel.assertExchange(exchange, exchangeType, {
        durable: true,
      });
    } catch (error) {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'Error asserting exchange',
        path: 'rpcConsumer',
      });
    }
    // Setup Dead Letter Exchange and Queue
    const deadLetter = await this.createDeadLetterExchangeAndQueue(
      channel,
      queueName,
      exchange,
      routingKey,
    );
    try {
      // Assert the queue
      await channel.assertQueue(queueName, {
        durable: true,

        deadLetterExchange: deadLetter?.dlxName ?? '',
        deadLetterRoutingKey: deadLetter?.dlKey ?? '',
      });
    } catch (error) {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'Error asserting queue',
        path: 'rpcConsumer',
      });
    }
    try {
      // Bind the queue to the exchange
      await channel.bindQueue(queueName, exchange, routingKey);
    } catch (error) {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'Error binding queue to exchange',
        path: 'rpcConsumer',
      });
    }
    // Prefetch from the Queue
    await channel.prefetch(this.prefetch);
    this.channelManager.returnChannel(channel);
  }

  async rpcConsumer<TData, TResponse>(
    options: RabbitMQOpts<TData, TResponse>,
    retry = 3,
  ): Promise<void> {
    if (this.state !== 'connected') {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'RabbitMQClient not initialized',
        path: 'rpcConsumer',
      });
    }
    if (!this.channelManager) {
      throw genericErrorHandler({
        statusCode: 424,
        message: 'RabbitMQClient not initialized',
        path: 'rpcConsumer',
      });
    }

    let channel: amqplib.Channel = {} as amqplib.Channel;

    try {
      channel =
        retry > 0
          ? await this.channelManager.borrowChannel(() => {
              console.log(
                'Callback is called, Retrying to get channel!',
                retry,
              );
              void this.rpcConsumer(options, retry--);
            })
          : await this.channelManager.borrowChannel();

      const messageOptions = options.messageOptions as RabbitMQConsumeOpts<
        TData,
        TResponse
      >;
      const queueName = `${messageOptions.exchange}.${messageOptions.routingKey}`;
      // Start consuming messages
      if (channel) {
        await channel.consume(
          queueName,
          (msg: amqplib.ConsumeMessage | null) => {
            if (msg) {
              let responsePayload: TResponse | GenericError;
              const properties = msg.properties as IMessageProperties;
              if (!properties.replyTo) {
                throw genericErrorHandler({
                  statusCode: 400,
                  message: 'Message properties not found',
                  path: 'rpcConsumer',
                });
              }

              void (async () => {
                try {
                  responsePayload = await this.processIncomingMessage(
                    msg,
                    options,
                  );
                } catch (error) {
                  console.error('Error processing message:', error);
                  try {
                    channel.sendToQueue(
                      properties.replyTo,
                      generateBuffer<GenericError>(error as GenericError),
                      {
                        correlationId: properties.correlationId,
                        ...options.opts,
                      },
                    );
                  } catch (error) {
                    console.error(
                      'Error sending response back to queue:',
                      error,
                    );
                    throw genericErrorHandler({
                      statusCode: 424,
                      message: 'Error sending error response back to queue',
                      path: 'rpcConsumer',
                    });
                  }
                  const shouldRequeue = this.shouldRequeue(
                    error as GenericError,
                  );
                  shouldRequeue
                    ? channel.nack(msg, false, true)
                    : channel.nack(msg, false, false);
                }
              })().finally(() => {
                if (responsePayload) {
                  try {
                    channel.sendToQueue(
                      properties.replyTo,
                      generateBuffer(responsePayload),
                      {
                        correlationId: properties.correlationId,
                        ...options.opts,
                      },
                    );
                    channel.ack(msg);
                  } catch (error) {
                    console.error(
                      'Error sending response back to queue:',
                      error,
                    );
                    throw genericErrorHandler({
                      statusCode: 424,
                      message: 'Error sending response back to queue',
                      path: 'rpcConsumer',
                    });
                  }
                }
              });
            }
          },
          { ...options.opts },
        );
      }
    } catch (error) {
      console.error('Error setting up RPC consumer:', error);

      if (!isGenericError(error as object)) {
        throw genericErrorHandler({
          statusCode: 424,
          message: 'Error in rpcConsumer setup after retries',
          path: 'rpcConsumer',
        });
      }
      throw error;
    } finally {
      if (channel) {
        this.channelManager.returnChannel(channel);
      }
    }
  }

  async rpcProducer<TData, TResponse>(
    options: RabbitMQOpts<TData, TResponse>,
  ): Promise<TResponse> {
    const messageOptions = options.messageOptions as RabbitMQPublishOpts<TData>;
    const validationOptions = options.validationOptions;
    let channel: amqplib.Channel = {} as amqplib.Channel;
    if (this.state !== 'connected') {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'RabbitMQClient not initialized',
        path: 'rpcProducer',
      });
    }
    if (!this.channelManager) {
      throw genericErrorHandler({
        statusCode: 503,
        message: 'No channel manager available for RPC Producer',
        path: 'rpcProducer',
      });
    }

    try {
      channel = await this.channelManager.borrowChannel();
      await channel.prefetch(1);

      if (!channel) {
        throw genericErrorHandler({
          statusCode: 503,
          message: 'No channel available for RPC Producer',
          path: 'rpcProducer',
        });
      }

      // Perform data validation upfront to fail fast on invalid data
      try {
        await validateAndTransform(
          validationOptions.request,
          messageOptions.payload,
          'Invalid message payload',
        );
      } catch (error) {
        if (!isGenericError(error as object)) {
          throw genericErrorHandler({
            statusCode: 400,
            message: 'Error validating message payload',
            path: 'rpcProducer',
          });
        }
        throw error;
      }

      const correlationId = randomUUID();
      const messageProperties = {
        correlationId,
        replyTo: options?.opts?.replyTo ?? 'amq.rabbitmq.reply-to',
        expiration: options?.opts?.expiration ?? DEFAULT_EXPIRATION,
      } as IRabbitMQPublishProps;

      // Await for response setup to avoid losing messages
      const responsePromise = this.waitForResponse(
        channel,
        messageProperties,
        validationOptions,
      );

      channel.publish(
        messageOptions.exchange,
        messageOptions.routingKey,
        generateBuffer(messageOptions.payload),
        {
          ...messageProperties,
          ...options.opts,
        },
      );

      // Wait for the response after publishing
      return await responsePromise;
    } catch (error) {
      if (!isGenericError(error as object)) {
        throw genericErrorHandler({
          statusCode: 424,
          message: 'Error in rpcProducer execution',
          path: 'rpcProducer',
        });
      }
      throw error;
    } finally {
      if (channel) {
        this.channelManager.returnChannel(channel, true);
      }
    }
  }

  /**
   * Creates a dead letter exchange and queue.
   * @param channel - The AMQP channel to use.
   * @param queueName - The name of the queue.
   * @param exchangeName - The name of the exchange.
   * @param key - The routing key.
   * @returns An object containing the names of the dead letter exchange, dead letter queue, and dead letter routing key.
   * @throws {GenericError} If there is an error creating the channel or the dead letter exchange and queue.
   */
  private async createDeadLetterExchangeAndQueue(
    channel: amqplib.Channel,
    queueName: string,
    exchangeName: string,
    key: string,
  ) {
    const dlxName = `${exchangeName}-dlx`;
    const dlqName = `${queueName}-dlq`;
    const dlKey = `${key}-dlk`;

    if (channel) {
      try {
        await channel.assertExchange(dlxName, 'direct', { durable: true });
        await channel.assertQueue(dlqName, {
          durable: true,
          deadLetterExchange: dlxName,
          deadLetterRoutingKey: dlKey,
        });
        await channel.bindQueue(dlqName, dlxName, dlKey);
        return { dlxName, dlqName, dlKey };
      } catch (error) {
        throw genericErrorHandler({
          statusCode: 503,
          message: 'Error creating Dead Letter Exchange and Queue',
          path: 'createDeadLetterExchangeAndQueue',
        });
      }
    }
  }

  private async waitForResponse<TData, TResponse>(
    channel: amqplib.Channel,
    messageProperties: IRabbitMQPublishProps,
    validationOptions: ValidationOptions<TData, TResponse>,
    timeoutMs = DEFAULT_EXPIRATION,
  ): Promise<TResponse> {
    return new Promise<TResponse>((resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        console.error('Timeout waiting for response');
        reject(
          genericErrorHandler({
            statusCode: 408,
            path: 'waitForResponse',
          }),
        );
      }, timeoutMs);

      // Consume the replyTo queue to get the response
      channel
        .consume(
          messageProperties.replyTo!,
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          async (msg) => {
            if (
              msg?.properties.correlationId === messageProperties.correlationId!
            ) {
              clearTimeout(timeoutHandler);
              try {
                if (!msg?.content) {
                  reject(
                    genericErrorHandler({
                      statusCode: 400,
                      message: 'Message content not found.',
                      path: 'waitForResponse',
                      queueError: true,
                    }),
                  );
                }
                const response = parseBufferOrString<TResponse | GenericError>(
                  msg.content,
                );
                if (isGenericError(response as object)) {
                  reject(response);
                }
                const validatedResponse = await validateAndTransform(
                  validationOptions.response,
                  parseBufferOrString(msg.content) as TResponse,
                  'The response payload does not meet the required schema',
                );
                await this.invalidateChannelConsumer(
                  channel,
                  msg.fields.consumerTag,
                );
                resolve(validatedResponse);
              } catch (error) {
                await this.invalidateChannelConsumer(
                  channel,
                  msg.fields.consumerTag,
                );
                reject(
                  genericErrorHandler({
                    statusCode: 424,
                    message: 'Error processing response',
                    path: 'waitForResponse',
                  }),
                );
              }
            } else {
              if (msg) {
                await this.invalidateChannelConsumer(
                  channel,
                  msg.fields.consumerTag,
                );
              }
              reject(
                genericErrorHandler({
                  statusCode: 400,
                  message: 'CorrelationId does not match',
                  path: 'waitForResponse',
                  queueError: true,
                }),
              );
            }
          },
          { noAck: true },
        )
        .catch((error) => {
          console.error('Error waiting for response:', error);
        });
      return void 0;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldRequeue(error: GenericError): boolean {
    // There should be a logic implemented to determine if a message should be requeued
    return false;
  }

  private async processIncomingMessage<TData, TResponse>(
    msg: amqplib.ConsumeMessage,
    options: RabbitMQOpts<TData, TResponse>,
  ): Promise<TResponse | GenericError> {
    try {
      let responsePayload: TResponse | GenericError;

      const { properties } = msg;
      const validationOptions = options.validationOptions;
      const messageOptions = options.messageOptions as RabbitMQConsumeOpts<
        TData,
        TResponse
      >;

      if (!properties.correlationId) {
        throw genericErrorHandler({
          statusCode: 400,
          message: 'CorrelationId property not found',
          path: 'rpcConsumer',
        });
      }

      if (!properties.replyTo) {
        throw genericErrorHandler({
          statusCode: 400,
          message: 'ReplyTo property not found',
          path: 'rpcConsumer',
        });
      }

      let content = parseBufferOrString<TData | GenericError>(msg.content);

      if (isGenericError(content as object)) {
        content = plainToInstance(GenericError, content);
        throw content;
      }

      content = plainToInstance(validationOptions.request.classType, content);

      try {
        // Validate the content before processing
        await validateAndTransform(
          validationOptions.request,
          content,
          'The content of the consumed message does not meet the required schema',
        );
      } catch (error) {
        if (!isGenericError(error as object)) {
          throw genericErrorHandler({
            statusCode: 400,
            message: 'An error ocurred during validation of consumed message',
            path: 'rpcConsumer',
          });
        }
        throw error;
      }

      try {
        responsePayload = await messageOptions.handler(content, properties);
      } catch (error) {
        throw genericErrorHandler({
          statusCode: 424,
          message: 'Error occured in handler',
          path: 'handler',
        });
      }

      // Validate the outgoing response payload before sending it back
      try {
        await validateAndTransform(
          options.validationOptions.response,
          responsePayload,
          'The response payload returned from handler does not meet the required schema',
        );
      } catch (error) {
        if (!isGenericError(error as object)) {
          throw genericErrorHandler({
            statusCode: 400,
            message: 'An error ocurred during validation of response payload',
            path: 'rpcConsumer',
          });
        }
        (error as GenericError).statusCode = 424;
        throw error;
      }

      return responsePayload;
    } catch (error) {
      console.error('Handler or validation error:', error);
      if (!isGenericError(error as object)) {
        throw genericErrorHandler({
          statusCode: 424,
          message: 'Error consuming message',
          path: 'rpcConsumer',
        });
      }
      throw error;
    }
  }

  private async invalidateChannelConsumer(
    channel: amqplib.Channel,
    consumerTag: string,
  ) {
    try {
      await channel.cancel(consumerTag);
    } catch (error) {
      console.error('Error cancelling consumer:', error);
    }
  }

  private setupConnectionListener() {
    this.connectionManager.on('connected', () => {
      console.log('RabbitMQ connected successfully.');
      void (async () => {
        try {
          await this.onConnectionReady();
          // Handle successful connection setup if needed
        } catch (error) {
          console.error('Error during connection setup:', error);
        }
      })();
    });
    this.connectionManager.on('closed', () => {
      this.state = 'closed';
      this.emit('closed');
    });
  }

  private async onConnectionReady() {
    try {
      this.channelManager = new ChannelManager(this.connectionManager);
      await this.channelManager.initializePool();
      this.state = 'connected';
      this.emit('ready');
    } catch (error) {
      console.error('Error initializing channel manager:', error);
    }
  }
}
