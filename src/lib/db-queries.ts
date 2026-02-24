import { getDb } from "./db";
import { generateId } from "./id";
import type { Recording, RecordingRow } from "./types";

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

export async function getAllRecordings(): Promise<Recording[]> {
  const db = await getDb();
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
}): Promise<Recording> {
  const db = await getDb();
  const id = generateId();

  await db.execute({
    sql: `INSERT INTO recordings (id, title, duration, has_webcam, width, height, mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title || "Untitled Recording",
      data.duration || 0,
      data.hasWebcam ? 1 : 0,
      data.width || null,
      data.height || null,
      data.mimeType || "video/webm",
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
