import { buildApp } from './app';
import { initDatabase } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 3106);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    await initDatabase();
    const app = buildApp();
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Resource service listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
