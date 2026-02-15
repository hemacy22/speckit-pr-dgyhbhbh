import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.config';
import { prisma, checkDatabaseConnection } from './config/database.config';
import { redis, checkRedisConnection } from './config/redis.config';
import { errorHandler, notFoundHandler } from './api/middleware/error-handler.middleware';
import { openApiValidator } from './api/middleware/openapi-validator.middleware';
import productsRouter from './api/routes/products.routes';

export async function createApp(): Promise<Application> {
  const app: Application = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ===== MONITORING PLACEHOLDERS =====
  // TODO: Integrate with production APM (Datadog, New Relic, Prometheus)
  
  // Response time logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log response time
      if (config.nodeEnv === 'production') {
        // TODO: Send to APM service
        // Example: datadogMetrics.increment('api.response_time', duration, { route: req.path, method: req.method });
      }
      
      // Console log in development
      if (config.nodeEnv === 'development') {
        console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
      
      // Track slow requests (> 500ms)
      if (duration > 500) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
        // TODO: Send alert to monitoring service
      }
    });
    
    next();
  });

  // Error rate tracking placeholder
  let errorCount = 0;
  let totalRequests = 0;

  app.use((_req, _res, next) => {
    totalRequests++;
    
    // TODO: Send to metrics service every 1 minute
    // Example: setInterval(() => { 
    //   const errorRate = (errorCount / totalRequests) * 100;
    //   datadogMetrics.gauge('api.error_rate', errorRate);
    // }, 60000);
    
    next();
  });

  // Request logging in development
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Health check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    const dbHealthy = await checkDatabaseConnection();
    const redisHealthy = await checkRedisConnection();

    const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    });
  });

  // OpenAPI validator middleware
  app.use(openApiValidator);

  // API routes
  app.use('/products', productsRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await redis.connect();

    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create and start Express app
    const app = await createApp();
    const server = app.listen(config.port, () => {
      console.log(`
🚀 Server ready at: http://localhost:${config.port}
📊 Health check: http://localhost:${config.port}/health
🌍 Environment: ${config.nodeEnv}
      `);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startServer();
}
