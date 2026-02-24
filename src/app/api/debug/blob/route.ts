import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check 1: Is BLOB_READ_WRITE_TOKEN set?
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  results.checks = {
    tokenExists: !!token,
    tokenLength: token ? token.length : 0,
    tokenPrefix: token ? token.substring(0, 12) + "..." : "NOT SET",
  };

  if (!token) {
    results.status = "FAIL";
    results.error = "BLOB_READ_WRITE_TOKEN environment variable is not set";
    results.fix =
      "Go to Vercel Dashboard → Project → Storage → Connect a Blob store. Then redeploy.";
    return NextResponse.json(results, { status: 500 });
  }

  // Check 2: Try server-side upload
  try {
    const testBlob = await put("_debug_test.txt", "test", {
      access: "private",
      contentType: "text/plain",
      addRandomSuffix: false,
    });

    results.checks = {
      ...results.checks as Record<string, unknown>,
      uploadSuccess: true,
      uploadUrl: testBlob.url,
    };

    // Clean up test file
    try {
      await del(testBlob.url);
      (results.checks as Record<string, unknown>).deleteSuccess = true;
    } catch {
      (results.checks as Record<string, unknown>).deleteSuccess = false;
    }

    results.status = "OK";
    results.message =
      "Blob store is working. Server-side upload succeeded. The issue is with client token generation.";
  } catch (error) {
    results.status = "FAIL";
    results.checks = {
      ...results.checks as Record<string, unknown>,
      uploadSuccess: false,
      uploadError: (error as Error).message,
    };
    results.error = "Server-side blob upload failed";
    results.fix =
      "The BLOB_READ_WRITE_TOKEN is invalid or the blob store is disconnected. Go to Vercel Dashboard → Project → Storage → reconnect or regenerate token. Then redeploy.";
  }

  // Check 3: List all env vars related to blob (names only, not values)
  const blobEnvVars = Object.keys(process.env).filter(
    (key) =>
      key.includes("BLOB") ||
      key.includes("VERCEL_BLOB") ||
      key.includes("STORAGE")
  );
  (results.checks as Record<string, unknown>).blobRelatedEnvVars = blobEnvVars;

  return NextResponse.json(results, {
    status: results.status === "OK" ? 200 : 500,
  });
}
