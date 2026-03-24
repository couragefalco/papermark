import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Use Neon serverless adapter in Trigger.dev workers (can't reach DB on port 5432)
  if (process.env.TRIGGER_DEV || process.env.USE_NEON_SERVERLESS) {
    neonConfig.webSocketConstructor = ws;
    const connectionString = process.env.POSTGRES_PRISMA_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as any);
  }

  return new PrismaClient();
}

const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
