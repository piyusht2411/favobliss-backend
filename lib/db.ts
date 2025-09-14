import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ||
  new PrismaClient({
    log: ["error", "query"], // Add 'query' to debug DB calls
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Directly use Amplify's env var
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
