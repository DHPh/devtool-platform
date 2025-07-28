import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      downloadUrl = "https://httpbin.org/bytes/1048576", // 1MB test file
      uploadUrl = "https://httpbin.org/post",
      testType = "download",
      duration = 10,
    } = await request.json();

    if (testType === "download") {
      return await performDownloadTest(downloadUrl, duration);
    } else if (testType === "upload") {
      return await performUploadTest(uploadUrl, duration);
    } else {
      return NextResponse.json(
        { error: "Invalid test type. Use 'download' or 'upload'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Speed test API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function performDownloadTest(url: string, duration: number) {
  const startTime = Date.now();
  let bytesDownloaded = 0;
  let completed = false;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({
        testType: "download",
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: Date.now(),
      });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({
        testType: "download",
        error: "Unable to read response stream",
        timestamp: Date.now(),
      });
    }

    const endTime = startTime + duration * 1000;

    while (Date.now() < endTime && !completed) {
      const { done, value } = await reader.read();

      if (done) {
        completed = true;
        break;
      }

      if (value) {
        bytesDownloaded += value.length;
      }
    }

    reader.releaseLock();

    const actualDuration = (Date.now() - startTime) / 1000;
    const speedBps = bytesDownloaded / actualDuration;
    const speedKbps = (speedBps * 8) / 1000;
    const speedMbps = speedKbps / 1000;

    return NextResponse.json({
      testType: "download",
      bytesTransferred: bytesDownloaded,
      duration: actualDuration,
      speedBps: Math.round(speedBps),
      speedKbps: Math.round(speedKbps * 100) / 100,
      speedMbps: Math.round(speedMbps * 100) / 100,
      completed,
      timestamp: Date.now(),
    });
  } catch (error) {
    const actualDuration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      testType: "download",
      error: error instanceof Error ? error.message : "Download test failed",
      bytesTransferred: bytesDownloaded,
      duration: actualDuration,
      timestamp: Date.now(),
    });
  }
}

async function performUploadTest(url: string, duration: number) {
  const startTime = Date.now();
  const chunkSize = 64 * 1024; // 64KB chunks
  let bytesUploaded = 0;

  try {
    // Create test data
    const testData = new Uint8Array(chunkSize).fill(65); // Fill with 'A'
    const endTime = startTime + duration * 1000;

    while (Date.now() < endTime) {
      try {
        const response = await fetch(url, {
          method: "POST",
          body: testData,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (response.ok) {
          bytesUploaded += chunkSize;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    const actualDuration = (Date.now() - startTime) / 1000;
    const speedBps = bytesUploaded / actualDuration;
    const speedKbps = (speedBps * 8) / 1000;
    const speedMbps = speedKbps / 1000;

    return NextResponse.json({
      testType: "upload",
      bytesTransferred: bytesUploaded,
      duration: actualDuration,
      speedBps: Math.round(speedBps),
      speedKbps: Math.round(speedKbps * 100) / 100,
      speedMbps: Math.round(speedMbps * 100) / 100,
      timestamp: Date.now(),
    });
  } catch (error) {
    const actualDuration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      testType: "upload",
      error: error instanceof Error ? error.message : "Upload test failed",
      bytesTransferred: bytesUploaded,
      duration: actualDuration,
      timestamp: Date.now(),
    });
  }
}
