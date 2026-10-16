import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // Migrations need a direct connection; Neon provides it as DATABASE_URL_UNPOOLED
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
