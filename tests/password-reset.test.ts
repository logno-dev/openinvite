import assert from "node:assert/strict";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import { passwordResetTokens, sessions, users } from "../src/db/schema";

test("password reset consumes links, revokes sessions, and rolls back failures", async (t) => {
  // The test runner isolates this file; never connect to the configured Turso DB.
  process.env.TURSO_DATABASE_URL = "file::memory:";
  process.env.TURSO_AUTH_TOKEN = "";
  const { client, db } = await import("../src/db/client");
  const { hashPassword, verifyPassword } = await import("../src/lib/auth");
  const { POST } = await import("../src/app/api/auth/password-reset/confirm/route");
  t.after(() => client.close());
  await client.executeMultiple(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, display_name TEXT, phone TEXT,
      share_email_with_guests INTEGER DEFAULT 0, created_at INTEGER DEFAULT 0);
    CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL, created_at INTEGER DEFAULT 0, expires_at INTEGER NOT NULL);
    CREATE TABLE password_reset_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER,
      created_at INTEGER DEFAULT 0);
  `);
  await db.insert(users).values({ id: "user", email: "guest@example.com", passwordHash: await hashPassword("old-password") });
  const expiresAt = new Date(Date.now() + 60_000);
  await db.insert(sessions).values({ id: "session", userId: "user", token: "session-token", expiresAt });
  await db.insert(passwordResetTokens).values([
    { id: "reset", userId: "user", token: "reset-token", expiresAt },
    { id: "other", userId: "user", token: "other-token", expiresAt },
    { id: "expired", userId: "user", token: "expired-token", expiresAt: new Date(0) },
  ]);

  const reset = (token: string) => POST(new Request("https://example.com/api/auth/password-reset/confirm", {
    method: "POST", body: JSON.stringify({ token, password: "new-password" }),
  }));

  assert.equal((await reset("expired-token")).status, 400);
  // A failed password update must not consume the token or revoke the session.
  await client.execute(`CREATE TRIGGER fail_password_update BEFORE UPDATE ON users
    BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END`);
  await assert.rejects(reset("reset-token"));
  const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.id, "reset"));
  assert.equal(record.usedAt, null);
  assert.equal((await db.select().from(sessions)).length, 1);
  await client.execute("DROP TRIGGER fail_password_update");

  assert.equal((await reset("reset-token")).status, 200);
  const [user] = await db.select().from(users);
  assert.equal(await verifyPassword(user.passwordHash, "new-password"), true);
  assert.equal(await verifyPassword(user.passwordHash, "old-password"), false);
  assert.equal((await db.select().from(sessions)).length, 0);
  assert.equal((await db.select().from(passwordResetTokens)).length, 0);
  assert.equal((await reset("reset-token")).status, 400);
  assert.equal((await reset("other-token")).status, 400);
});
