import * as OpenApiValidator from 'express-openapi-validator';
import path from 'path';

/**
 * OpenAPI validator middleware
 * Validates requests and responses against OpenAPI specification
 */
export const openApiValidator = OpenApiValidator.middleware({
  apiSpec: path.join(__dirname, '../../openapi/rating-summary-api.yaml'),
  validateRequests: true,
  validateResponses: process.env.NODE_ENV === 'development', // Only in dev
  validateApiSpec: true,
  $refParser: {
    mode: 'bundle',
  },
});
