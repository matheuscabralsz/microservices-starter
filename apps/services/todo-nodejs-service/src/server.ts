import { buildApp } from './app';
import { initDatabase } from './config/database';
import { initKafkaProducer, disconnectKafkaProducer } from './config/kafka';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 3105);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    // Initialize database
    await initDatabase();

    // Initialize Kafka producer
    await initKafkaProducer();

    // Build and start app
    const app = buildApp();
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Todo service listening on http://${HOST}:${PORT}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await disconnectKafkaProducer();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
