# API Gateway Service

## Foreside - Taking IT Forward!

A NestJS-based HTTP API gateway used for message-based integrations and training scenarios at Foreside. As part of our "Taking IT Forward!" initiative, the service exposes REST APIs, integrates with RabbitMQ for asynchronous messaging, and persists data in PostgreSQL via TypeORM. Everything is designed to run locally via Docker Compose.

## Features

- NestJS HTTP API gateway
- RabbitMQ message broker integration
- PostgreSQL persistence using TypeORM
- Local JWT-based authentication
- Environment-based configuration
- OpenAPI/Swagger API documentation
- Basic rate limiting and security headers

## Prerequisites

- Node.js (v18 or higher is recommended)
- Docker and Docker Compose
- npm package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd api-gateway-security
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env
```

Adjust values in `.env` as needed.

## Configuration

The service is configured through environment variables. Some key groups:

- **Server**

  - `PORT` – HTTP port (default: 3001)
  - `HOST` – bind address (default: 0.0.0.0)
  - `NODE_ENV` – environment (development/production)

- **JWT auth**

  - `JWT_SECRET` – symmetric signing key
  - `JWT_EXPIRES_IN` – token lifetime

- **RabbitMQ**

  - `RABBITMQ_HOST` / `RABBITMQ_PORT`
  - `RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD`

- **PostgreSQL**
  - `DB_HOST`, `DB_PORT`
  - `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`

See `.env.example` for the full list and defaults.

## Running the application

### Using Docker (recommended)

```bash
# Start all services (API, RabbitMQ, Postgres)
docker compose up

# Start in detached mode
docker compose up -d
```

The API will be available on `http://localhost:3001` by default.

### Local development (without Docker for the app)

You can also run the NestJS application directly, as long as RabbitMQ and PostgreSQL are reachable (for example, from Docker or another host):

```bash
# Development mode with watch
npm run start:dev

# Regular start
npm run start

# Production build + run
npm run build
npm run start:prod
```

## RabbitMQ & PostgreSQL

The provided `docker-compose.yml` file starts:

- A single RabbitMQ instance with the standard AMQP port exposed on `localhost:5672`
- A PostgreSQL instance with the default port exposed on `localhost:5432`
- The API gateway service, wired to these containers by default

You can adjust ports and credentials through environment variables.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API documentation

Swagger/OpenAPI documentation is available at:

- Local development: `http://localhost:3001/docs/api`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-change`)
3. Commit your changes (`git commit -m 'Describe my change'`)
4. Push to the branch (`git push origin feature/my-change`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

For questions or issues, please contact the maintainers of this repository.

## Foreside - Taking IT Forward!
