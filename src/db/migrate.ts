import "dotenv/config";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index.js";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✅ Migrations applied successfully.");
process.exit(0);
