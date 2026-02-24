import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS recordings (
        id            TEXT PRIMARY KEY,
        title         TEXT NOT NULL DEFAULT 'Untitled Recording',
        blob_url      TEXT NOT NULL DEFAULT '',
        file_size     INTEGER NOT NULL DEFAULT 0,
        duration      REAL NOT NULL DEFAULT 0,
        mime_type     TEXT NOT NULL DEFAULT 'video/webm',
        width         INTEGER,
        height        INTEGER,
        has_webcam    INTEGER NOT NULL DEFAULT 0,
        thumbnail     TEXT,
        view_count    INTEGER NOT NULL DEFAULT 0,
        status        TEXT NOT NULL DEFAULT 'processing',
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
    `);
    initialized = true;
  }
  return client;
}
