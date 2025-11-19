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
  apis: ['../../src/services/harvesterService.ts'],
};

export default swaggerOptions;
