import { getDb } from "./db";
import { generateId } from "./id";
import type { Recording, RecordingRow, Tag, TagRow, TagWithCount } from "./types";

function rowToRecording(row: RecordingRow): Recording {
  return {
    id: row.id as string,
    title: row.title as string,
    blobUrl: row.blob_url as string,
    fileSize: row.file_size as number,
    duration: row.duration as number,
    mimeType: row.mime_type as string,
    width: row.width as number | null,
    height: row.height as number | null,
    hasWebcam: row.has_webcam === 1,
    thumbnail: row.thumbnail as string | null,
    viewCount: row.view_count as number,
    status: row.status as Recording["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    icon: (row.icon as string) || "tag",
  };
}

// ─── Recordings ─────────────────────────────────────────────

export async function getAllRecordings(tag?: string): Promise<Recording[]> {
  const db = await getDb();
  if (tag) {
    const result = await db.execute({
      sql: `SELECT DISTINCT r.* FROM recordings r
            JOIN recording_tags rt ON r.id = rt.recording_id
            JOIN tags t ON rt.tag_id = t.id
            WHERE t.name = ?
            ORDER BY r.created_at DESC`,
      args: [tag],
    });
    return result.rows.map((row) => rowToRecording(row as unknown as RecordingRow));
  }
  const result = await db.execute(
    "SELECT * FROM recordings ORDER BY created_at DESC"
  );
  return result.rows.map((row) => rowToRecording(row as unknown as RecordingRow));
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM recordings WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToRecording(result.rows[0] as unknown as RecordingRow);
}

export async function createRecording(data: {
  title?: string;
  duration?: number;
  hasWebcam?: boolean;
  width?: number;
  height?: number;
  mimeType?: string;
  thumbnail?: string;
}): Promise<Recording> {
  const db = await getDb();
  const id = generateId();

  await db.execute({
    sql: `INSERT INTO recordings (id, title, duration, has_webcam, width, height, mime_type, thumbnail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title || "Untitled Recording",
      data.duration || 0,
      data.hasWebcam ? 1 : 0,
      data.width || null,
      data.height || null,
      data.mimeType || "video/webm",
      data.thumbnail || null,
    ],
  });

  return (await getRecordingById(id))!;
}

export async function updateRecording(
  id: string,
  data: Partial<{
    title: string;
    fileSize: number;
    duration: number;
    status: string;
    blobUrl: string;
    thumbnail: string;
  }>
): Promise<Recording | null> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.title !== undefined) {
    sets.push("title = ?");
    values.push(data.title);
  }
  if (data.fileSize !== undefined) {
    sets.push("file_size = ?");
    values.push(data.fileSize);
  }
  if (data.duration !== undefined) {
    sets.push("duration = ?");
    values.push(data.duration);
  }
  if (data.status !== undefined) {
    sets.push("status = ?");
    values.push(data.status);
  }
  if (data.blobUrl !== undefined) {
    sets.push("blob_url = ?");
    values.push(data.blobUrl);
  }
  if (data.thumbnail !== undefined) {
    sets.push("thumbnail = ?");
    values.push(data.thumbnail);
  }

  if (sets.length === 0) return getRecordingById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  await db.execute({
    sql: `UPDATE recordings SET ${sets.join(", ")} WHERE id = ?`,
    args: values,
  });

  return getRecordingById(id);
}

export async function deleteRecording(id: string): Promise<boolean> {
  const db = await getDb();
  // Clean up tag associations first (no foreign key cascade in Turso)
  await db.execute({
    sql: "DELETE FROM recording_tags WHERE recording_id = ?",
    args: [id],
  });
  const result = await db.execute({
    sql: "DELETE FROM recordings WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function incrementViewCount(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE recordings SET view_count = view_count + 1 WHERE id = ?",
    args: [id],
  });
}

// ─── Tags ───────────────────────────────────────────────────

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM tags ORDER BY name");
  return result.rows.map((row) => rowToTag(row as unknown as TagRow));
}

export async function getAllTagsWithCounts(): Promise<TagWithCount[]> {
  const db = await getDb();
  const result = await db.execute(
    `SELECT t.*, COUNT(rt.recording_id) as count
     FROM tags t
     LEFT JOIN recording_tags rt ON t.id = rt.tag_id
     GROUP BY t.id
     ORDER BY t.name`
  );
  return result.rows.map((row) => ({
    ...rowToTag(row as unknown as TagRow),
    count: (row as unknown as { count: number }).count,
  }));
}

export async function getTagsForRecording(recordingId: string): Promise<Tag[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT t.* FROM tags t
          JOIN recording_tags rt ON t.id = rt.tag_id
          WHERE rt.recording_id = ?
          ORDER BY t.name`,
    args: [recordingId],
  });
  return result.rows.map((row) => rowToTag(row as unknown as TagRow));
}

export async function getTagsForRecordings(
  recordingIds: string[]
): Promise<Record<string, Tag[]>> {
  if (recordingIds.length === 0) return {};
  const db = await getDb();
  const placeholders = recordingIds.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT rt.recording_id, t.* FROM tags t
          JOIN recording_tags rt ON t.id = rt.tag_id
          WHERE rt.recording_id IN (${placeholders})
          ORDER BY t.name`,
    args: recordingIds,
  });

  const map: Record<string, Tag[]> = {};
  for (const id of recordingIds) {
    map[id] = [];
  }
  for (const row of result.rows) {
    const recId = row.recording_id as string;
    if (map[recId]) {
      map[recId].push(rowToTag(row as unknown as TagRow));
    }
  }
  return map;
}

export async function createTag(name: string, color: string, icon: string = "tag"): Promise<Tag> {
  const db = await getDb();
  const id = generateId();
  await db.execute({
    sql: "INSERT INTO tags (id, name, color, icon) VALUES (?, ?, ?, ?)",
    args: [id, name, color, icon],
  });
  return { id, name, color, icon };
}

export async function updateTag(
  id: string,
  updates: { name?: string; color?: string; icon?: string }
): Promise<Tag | null> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number)[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    args.push(updates.name);
  }
  if (updates.color !== undefined) {
    sets.push("color = ?");
    args.push(updates.color);
  }
  if (updates.icon !== undefined) {
    sets.push("icon = ?");
    args.push(updates.icon);
  }

  if (sets.length === 0) return null;

  args.push(id);
  await db.execute({
    sql: `UPDATE tags SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });

  const result = await db.execute({
    sql: "SELECT * FROM tags WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToTag(result.rows[0] as unknown as TagRow);
}

export async function deleteTag(id: string): Promise<boolean> {
  const db = await getDb();
  // Clean up associations
  await db.execute({
    sql: "DELETE FROM recording_tags WHERE tag_id = ?",
    args: [id],
  });
  const result = await db.execute({
    sql: "DELETE FROM tags WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function addTagToRecording(
  recordingId: string,
  tagId: string
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO recording_tags (recording_id, tag_id) VALUES (?, ?)",
    args: [recordingId, tagId],
  });
}

export async function removeTagFromRecording(
  recordingId: string,
  tagId: string
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM recording_tags WHERE recording_id = ? AND tag_id = ?",
    args: [recordingId, tagId],
  });
}
