import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app: Express): void {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Data Harvester API',
        version: '1.0.0',
        description: 'API for managing records, rules, and background harvesting jobs.',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
        },
      ],
    },
    apis: ['./backend/src/api/routes/**/*.ts', './backend/src/api/controllers/**/*.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
