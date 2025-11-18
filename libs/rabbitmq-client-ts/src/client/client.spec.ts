/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';
import { ChannelManager } from './channel-manager';
import { ConnectionManager } from './connection-manager';
import {
  ExchangeType,
  RabbitMQConsumeOpts,
  RabbitMQPublishOpts,
  RabbitMQOpts,
  IRabbitMQClientCredentialsProps,
  IRabbitMQClientProps,
} from '../types';
import * as amqplib from 'amqplib';
import { RabbitMQClient } from './client';
import { genericErrorHandler } from '../utils';

jest.mock('amqplib');
jest.mock('./connection-manager');
jest.mock('./channel-manager');

describe('RabbitMQClient', () => {
  let client: RabbitMQClient;
  let connectionManagerMock: jest.Mocked<ConnectionManager>;
  let channelManagerMock: jest.Mocked<ChannelManager>;
  let channelMock: jest.Mocked<amqplib.Channel>;

  const mockCredentials: IRabbitMQClientCredentialsProps = {
    username: 'test',
    password: 'test',
  };

  const mockProps: IRabbitMQClientProps = {
    hosts: ['localhost'],
    credentials: mockCredentials,
    secure: false,
    port: 5672,
  };

  beforeEach(() => {
    connectionManagerMock = new ConnectionManager(
      ['localhost'],
      false,
      5672,
      mockCredentials,
    ) as jest.Mocked<ConnectionManager>;
    channelManagerMock = new ChannelManager(
      connectionManagerMock,
    ) as jest.Mocked<ChannelManager>;

    channelMock = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'mockConsumer' }),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<amqplib.Channel>;

    channelManagerMock.borrowChannel.mockResolvedValue(channelMock);
    channelManagerMock.returnChannel.mockImplementation();
    client = new RabbitMQClient(mockProps);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    client.connectionManager = connectionManagerMock;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    client.channelManager = channelManagerMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialize', () => {
    it('should initialize connection successfully', async () => {
      connectionManagerMock.createConnection.mockResolvedValue(
        {} as amqplib.Connection,
      );

      await expect(client.initialize('/')).resolves.toBeUndefined();
      expect(connectionManagerMock.createConnection).toHaveBeenCalledWith('/');
    });

    it('should throw error if initialization fails', async () => {
      connectionManagerMock.createConnection.mockRejectedValue(
        genericErrorHandler({
          statusCode: 500,
          message: 'Connection Error',
          path: 'connectionManager',
        }),
      );

      await expect(client.initialize('/')).rejects.toThrow('Connection Error');
    });
  });

  describe('setupQueue', () => {
    beforeEach(async () => {
      await client.initialize('/');
      client.state = 'connected';
    });

    it('should setup queue and bind it correctly', async () => {
      await expect(
        client.setupQueue(
          'testExchange',
          'testRoutingKey',
          ExchangeType.Direct,
        ),
      ).resolves.toBeUndefined();

      expect(channelMock.assertExchange).toHaveBeenCalledWith(
        'testExchange',
        ExchangeType.Direct,
        {
          durable: true,
        },
      );
      expect(channelMock.assertQueue).toHaveBeenCalledWith(
        'testExchange.testRoutingKey',
        expect.any(Object),
      );
      expect(channelMock.bindQueue).toHaveBeenCalledWith(
        'testExchange.testRoutingKey',
        'testExchange',
        'testRoutingKey',
      );
      expect(channelMock.prefetch).toHaveBeenCalledWith(10);
    });

    it('should throw error if client is not connected', async () => {
      client.state = 'closed';

      await expect(
        client.setupQueue(
          'testExchange',
          'testRoutingKey',
          ExchangeType.Direct,
        ),
      ).rejects.toThrow('RabbitMQClient not initialized');
    });
  });

  describe('rpcConsumer', () => {
    let rpcOptions: RabbitMQOpts<{ data: string }, { response: string }>;

    beforeEach(async () => {
      rpcOptions = {
        messageOptions: {
          exchange: 'testExchange',
          routingKey: 'testRoutingKey',
          payload: { data: 'test' },
          // eslint-disable-next-line @typescript-eslint/require-await
          handler: async (data) => ({
            response: `Handled: ${data.data}`,
          }),
        } as RabbitMQConsumeOpts<{ data: string }, { response: string }>,
        validationOptions: {
          request: {
            classType: class {
              data: string;
            },
          },
          response: {
            classType: class {
              response: string;
            },
          },
        },
        opts: {},
      };

      await client.initialize('/');
      client.state = 'connected';
    });

    it('should setup RPC consumer and process messages correctly', async () => {
      const msg: amqplib.ConsumeMessage = {
        properties: {
          correlationId: 'testId',
          replyTo: 'testReplyTo',
          contentType: undefined,
          contentEncoding: undefined,
          headers: undefined,
          deliveryMode: undefined,
          priority: undefined,
          expiration: undefined,
          messageId: undefined,
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined,
        },
        content: Buffer.from(JSON.stringify({ data: 'test' })),
        fields: {
          consumerTag: 'mockConsumer',
          deliveryTag: 0,
          redelivered: false,
          exchange: '',
          routingKey: '',
        },
      };

      channelMock.consume.mockImplementationOnce((queue, onMessage) => {
        onMessage(msg);
        return Promise.resolve({ consumerTag: 'mockConsumer' });
      });

      await expect(client.rpcConsumer(rpcOptions)).resolves.toBeUndefined();

      expect(channelMock.consume).toHaveBeenCalledWith(
        'testExchange.testRoutingKey',
        expect.any(Function),
        expect.any(Object),
      );
    });

    it('should throw error if client is not connected', async () => {
      client.state = 'closed';

      await expect(client.rpcConsumer(rpcOptions)).rejects.toThrow(
        genericErrorHandler({
          statusCode: 503,
          message: 'RabbitMQClient not initialized',
          path: 'rpcConsumer',
        }),
      );
    });
  });

  describe('rpcProducer', () => {
    let rpcOptions: RabbitMQOpts<{ data: string }, { response: string }>;

    beforeEach(async () => {
      rpcOptions = {
        messageOptions: {
          exchange: 'testExchange',
          routingKey: 'testRoutingKey',
          payload: { data: 'test' }, // Ensure this matches the structure defined in the validation schema
        } as RabbitMQPublishOpts<{ data: string }>,
        validationOptions: {
          request: {
            classType: class {
              data!: string;
            },
          },
          response: {
            classType: class {
              response!: string;
            },
          },
        },
        opts: {},
      };

      await client.initialize('/');
      client.state = 'connected';
    });

    /*     it('should publish a message and wait for a response', async () => {
      const responseBuffer = Buffer.from(JSON.stringify({ response: 'test' }));
      const msg: amqplib.ConsumeMessage = {
        properties: {
          correlationId: 'testId',
          contentType: undefined,
          contentEncoding: undefined,
          headers: undefined,
          deliveryMode: undefined,
          priority: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: undefined,
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined,
        },
        content: responseBuffer,
        fields: {
          consumerTag: 'mockConsumer',
          deliveryTag: 0,
          redelivered: false,
          exchange: '',
          routingKey: '',
        },
      };

      channelMock.consume.mockImplementationOnce((queue, onMessage) => {
        onMessage(msg);
        return Promise.resolve({ consumerTag: 'mockConsumer' });
      });

      const response = await client.rpcProducer(rpcOptions);

      expect(channelMock.publish).toHaveBeenCalledWith(
        'testExchange',
        'testRoutingKey',
        expect.any(Buffer),
        expect.objectContaining({
          correlationId: expect.any(String),
          replyTo: expect.any(String),
          expiration: expect.any(String),
        }),
      );
      expect(response).toEqual({ response: 'test' });
    });
 */
    it('should throw error if client is not connected', async () => {
      client.state = 'closed';

      await expect(client.rpcProducer(rpcOptions)).rejects.toThrow(
        genericErrorHandler({
          statusCode: 503,
          message: 'RabbitMQClient not initialized',
          path: 'rpcProducer',
        }),
      );
    });
  });
});
