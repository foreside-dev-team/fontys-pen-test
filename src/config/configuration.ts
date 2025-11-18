import { HelmetOptions } from 'helmet';
import { IRabbitMQClientProps } from 'rabbitmq-client-ts';
import { version } from '../../package.json';
import { z } from 'zod';

export enum ENVIRONMENT {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  SANDBOX = 'sandbox',
}

export type ISupportedScopes = 'sales_orders.sync';

export type IThrottler = {
  ttl: number;
  limit: number;
};

export interface RabbitMQClientConfigProps extends IRabbitMQClientProps {
  vhost: string;
}

export type IRabbitMQConfig = {
  client: RabbitMQClientConfigProps;
  options: {
    [key: string]: {
      exchange: string;
      routingKey: string;
    };
  };
};

export type IConfiguration = {
  currentApiVersion: string;
  applicationName: string;
  host: string;
  port: number;
  environment?: ENVIRONMENT;
  helmet: HelmetOptions;
  supportedScopes: ISupportedScopes[];
  throttler: IThrottler;
  rabbitmq: IRabbitMQConfig;
};

export const CURRENT_API_VERSION = version.split('.')[0];

const ConfigSchema = z.object({
  currentApiVersion: z.string(),
  applicationName: z.string(),
  environment: z.nativeEnum(ENVIRONMENT),
  host: z.string(),
  port: z.number(),
  helmet: z.object({
    dnsPrefetchControl: z.object({ allow: z.boolean() }),
    frameguard: z.object({
      action: z.enum(['deny', 'sameorigin', 'allow-from']),
    }),
    hidePoweredBy: z.boolean(),
    hsts: z.object({
      maxAge: z.number(),
      includeSubDomains: z.boolean(),
      preload: z.boolean(),
    }),
    ieNoOpen: z.boolean(),
    noSniff: z.boolean(),
    referrerPolicy: z.object({ policy: z.string() }),
    xssFilter: z.boolean(),
  }),
  supportedScopes: z.array(z.string()),
  rabbitmq: z.object({
    client: z.object({
      hosts: z.union([z.string(), z.array(z.string())]),
      port: z.number(),
      secure: z.boolean(),
      vhost: z.string(),
      credentials: z.object({
        username: z.string().optional(),
        password: z.string().optional(),
      }),
    }),
    options: z.object({
      salesOrderSync: z.object({
        exchange: z.string(),
        routingKey: z.string(),
      }),
    }),
  }),
  throttler: z.object({
    ttl: z.number(),
    limit: z.number(),
  }),
});

const config = (): IConfiguration => {
  const supportedScopesString = process.env.SUPPORTED_SCOPES;
  const hosts = process.env.RABBITMQ_HOSTS;
  let supportedScopes: ISupportedScopes[] = [];
  let hostsArray: string[] | string = [];

  try {
    supportedScopes = JSON.parse(supportedScopesString || '[]');
    if (!Array.isArray(supportedScopes)) {
      throw new Error('Supported scopes must be an array');
    }
    hostsArray = JSON.parse(hosts) || hosts;
  } catch (error) {
    console.error(
      'Error parsing hosts and/or supportedScopes from Environment variables',
    );
    supportedScopes = [];
    hostsArray = [];
  }

  const configObject = {
    currentApiVersion: CURRENT_API_VERSION || '0.0.0',
    applicationName: process.env.APPLICATION_NAME || 'API Gateway',
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 3001,
    environment:
      ENVIRONMENT[process.env.NODE_ENV?.toUpperCase()] ||
      ENVIRONMENT.DEVELOPMENT,
    helmet: {
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true,
    },
    supportedScopes,
    rabbitmq: {
      client: {
        hosts: hostsArray,
        port: Number(process.env.RABBITMQ_PORT),
        secure: process.env.RABBITMQ_SECURE === 'true',
        vhost: process.env.RABBITMQ_VHOST,
        credentials: {
          username: process.env.RABBITMQ_USERNAME,
          password: process.env.RABBITMQ_PASSWORD,
        },
      },
      options: {
        salesOrderSync: {
          exchange: process.env.RABBITMQ_CRM_SALES_EXCHANGE,
          routingKey: process.env.RABBITMQ_CRM_SALES_ROUTING_KEY,
        },
      },
    },
    throttler: {
      ttl: Number(process.env.THROTTLE_TTL),
      limit: Number(process.env.THROTTLE_LIMIT),
    },
  };
  try {
    const parsedConfig = ConfigSchema.parse(configObject);
    return parsedConfig as IConfiguration;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration');
  }
};

export default config;
