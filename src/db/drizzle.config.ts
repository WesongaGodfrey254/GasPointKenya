import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sqlHost = process.env.SQL_HOST || "127.0.0.1";
const sqlDbName = process.env.SQL_DB_NAME || "gaspoint_db";
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || "gaspoint_user";
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString
    ? { url: connectionString }
    : {
        host: sqlHost,
        user: user,
        password: password,
        database: sqlDbName,
        ssl: process.env.SQL_SSL === 'true',
      },
  verbose: true,
});
