import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/index.js"; // your drizzle instance
import * as schema from "../db/schema/auth.js";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not Configured in .env file");
}
if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not Configured in .env file");
}
console.log(FRONTEND_URL);
export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [FRONTEND_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true, // Allow role to be set during registration
      },
      imageCldPubId: {
        type: "string",
        required: false,
        input: true, // Allow imageCldPubId to be set during registration
      },
    },
  },
});
