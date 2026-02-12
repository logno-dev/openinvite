import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

config({ path: join(rootDir, ".env.local") });
config({ path: join(rootDir, ".env") });

const url = process.env.TURSO_DATABASE_URL ?? "";
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
