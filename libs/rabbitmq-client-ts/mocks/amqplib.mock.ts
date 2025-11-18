export const amqplib = {
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      prefetch: jest.fn(),
      consume: jest.fn(),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
  credentials: {
    external: jest.fn(),
  },
};
