import { DocumentBuilder, type SwaggerCustomOptions } from '@nestjs/swagger';

export const customSwaggerOptions: SwaggerCustomOptions = {
  customCssUrl: '/assets/swagger/custom-theme.css',
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export const swaggerConfig = new DocumentBuilder()
  .setTitle('API Gateway')
  .setDescription('JSON/Restful API interface documentation')
  .addBearerAuth()
  .addServer('http://localhost:3001', 'Local Development')
  .setVersion('0.0.3')
  .build();
