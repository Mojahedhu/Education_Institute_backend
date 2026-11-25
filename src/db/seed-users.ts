import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./index.js";
import { account, user } from "./schema/auth.js";

function buildUsers(count: number, role: "student" | "teacher") {
  return Array.from({ length: count }, (_, i) => {
    const index = i + 1;
    const label = role === "student" ? "Student" : "Teacher";
    return {
      id: crypto.randomUUID(),
      name: `${label} ${index}`,
      email: `${role}${index}@test.local`,
      emailVerified: true,
      role,
      password: `${label}@${index}234`,
    };
  });
}

async function main() {
  const students = buildUsers(20, "student");
  const teachers = buildUsers(5, "teacher");
  const allUsers = [...students, ...teachers];
  const passwordByEmail = new Map(allUsers.map((u) => [u.email, u.password]));

  await db
    .insert(user)
    .values(allUsers.map(({ password: _password, ...u }) => u))
    .onConflictDoNothing({ target: user.email });

  const dbUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(inArray(user.email, allUsers.map((u) => u.email)));

  for (const u of dbUsers) {
    const plainPassword = passwordByEmail.get(u.email);
    if (!plainPassword) continue;

    const hashedPassword = await hashPassword(plainPassword);
    const [existingAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, u.id),
          eq(account.providerId, "credential"),
        ),
      )
      .limit(1);

    if (existingAccount) {
      await db
        .update(account)
        .set({ password: hashedPassword })
        .where(eq(account.id, existingAccount.id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: hashedPassword,
      });
    }
  }

  const withPasswords = dbUsers.map((u) => ({
    ...u,
    password: passwordByEmail.get(u.email) ?? "",
  }));

  const reference = {
    seededAt: new Date().toISOString(),
    counts: {
      students: withPasswords.filter((u) => u.role === "student").length,
      teachers: withPasswords.filter((u) => u.role === "teacher").length,
      total: withPasswords.length,
    },
    students: withPasswords.filter((u) => u.role === "student"),
    teachers: withPasswords.filter((u) => u.role === "teacher"),
  };

  const outPath = path.resolve(process.cwd(), "seed-users.json");
  await fs.writeFile(outPath, JSON.stringify(reference, null, 2), "utf8");

  console.log(
    `Seeded credentials for ${reference.counts.students} students and ${reference.counts.teachers} teachers. Reference saved to ${outPath}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed users:", err);
  process.exit(1);
});
