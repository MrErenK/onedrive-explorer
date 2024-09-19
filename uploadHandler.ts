import { Client } from "@microsoft/microsoft-graph-client";
import { Readable } from "stream";
import { EventEmitter } from "events";
import os from "os";

function calculateChunkSize(): number {
  const totalMemory = os.totalmem();
  const baseChunkSize = 25 * 1024 * 1024; // 25 MB base size
  const desiredChunkSize = Math.floor(totalMemory / (1024 * 1024 * 100)); // 1/100th of total memory
  const maxChunkSize = 100 * 1024 * 1024; // 200 MB max size

  return Math.min(desiredChunkSize * 1024 * 1024, maxChunkSize);
}

const CHUNK_SIZE = calculateChunkSize();
console.log(`Using chunk size: ${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)} MB`);

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export class UploadHandler extends EventEmitter {
  private client: Client;
  private fullPath: string;
  private bytesUploaded: number = 0;
  private lastProgressUpdate: number = 0;
  private uploadUrl: string = "";
  private isCancelled: boolean = false;
  private uploadedChunks: Set<number> = new Set();
  private maxRetries: number = 3;
  private chunkIndex: number = 0;

  constructor(
    private accessToken: string,
    private fileStream: NodeJS.ReadableStream,
    private fileName: string,
    private fileSize: number,
    private mimeType: string,
    private uploadPath: string,
  ) {
    super();
    this.fullPath = uploadPath === "/" ? fileName : `${uploadPath}/${fileName}`;
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    console.log(`UploadHandler initialized for ${this.fileName}`);
  }

  private async getUploadStatus(): Promise<any> {
    const response = await fetch(this.uploadUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Failed to get upload status: ${response.statusText}`);
    }
    return response.json();
  }

  private async getFileInfo(): Promise<any> {
    try {
      const response = await this.client
        .api(`/me/drive/root:/${this.fullPath}`)
        .get();
      console.log(`File info retrieved:`, response);
      return response;
    } catch (error) {
      console.error("Error getting file info:", error);
      return null;
    }
  }

  private async uploadChunk(
    chunk: Buffer,
    index: number,
    totalChunks: number,
  ): Promise<any> {
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + chunk.length - 1, this.fileSize - 1);
    const contentRange = `bytes ${start}-${end}/${this.fileSize}`;

    try {
      const response = await fetch(this.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": chunk.length.toString(),
          "Content-Range": contentRange,
          "Content-Type": this.mimeType,
        },
        body: chunk,
      });

      if (!response.ok) {
        throw { status: response.status, message: response.statusText };
      }

      this.bytesUploaded += chunk.length;
      this.emitProgress();

      return response.status === 202 ? null : response.json();
    } catch (error) {
      console.error(
        `Error uploading chunk ${index + 1}/${totalChunks}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async initializeUpload(): Promise<void> {
    console.log(
      `Initializing upload for: ${this.fullPath} (${this.fileSize} bytes)`,
    );
    try {
      const response = await this.client
        .api(`/me/drive/root:/${this.fullPath}:/createUploadSession`)
        .post({
          item: {
            "@microsoft.graph.conflictBehavior": "replace",
            name: this.fileName,
          },
        });

      if (response && response.uploadUrl) {
        this.uploadUrl = response.uploadUrl;
        console.log(`Upload session created for ${this.fileName}`);
      } else {
        throw new Error("Failed to obtain upload URL from the response");
      }
    } catch (error) {
      console.error("Error creating upload session:", error);
      throw new Error("Failed to create upload session");
    }

    if (!this.uploadUrl) {
      throw new Error("Failed to obtain upload URL");
    }
  }

  private updateUploadedRanges(nextExpectedRanges: string[]): void {
    this.uploadedChunks.clear();
    for (const range of nextExpectedRanges) {
      const [start, end] = range.split("-").map(Number);
      const startChunk = Math.floor(start / CHUNK_SIZE);
      const endChunk = Math.floor((end || this.fileSize - 1) / CHUNK_SIZE);
      for (let i = 0; i < startChunk; i++) {
        this.uploadedChunks.add(i);
      }
    }
  }

  async upload(): Promise<any> {
    try {
      console.log(`Starting upload process for ${this.fileName}`);
      await this.initializeUpload();
      const uploadStatus = await this.getUploadStatus();
      this.updateUploadedRanges(uploadStatus.nextExpectedRanges);
      const uploadResult = await this.streamUpload();

      if (this.isCancelled) {
        console.log(`Upload cancelled for ${this.fileName}`);
        await this.cancelUpload();
        return { status: "cancelled", name: this.fileName };
      }

      console.log(`Upload process completed for ${this.fileName}`);

      let result = {
        status: "completed",
        name: this.fileName,
        id: uploadResult.id || "unknown",
        path: this.fullPath,
      };

      if (result.id === "unknown") {
        const fileInfo = await this.getFileInfo();
        if (fileInfo && fileInfo.id) {
          result.id = fileInfo.id;
        }
      }

      return result;
    } catch (error) {
      console.error("Error in upload process:", error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  private async streamUpload(): Promise<any> {
    console.log(
      `Starting streaming upload for ${this.fileName} (${this.fileSize} bytes)`,
    );
    const totalChunks = Math.ceil(this.fileSize / CHUNK_SIZE);
    let finalResponse;

    while (this.chunkIndex < totalChunks) {
      if (this.isCancelled) break;

      if (!this.uploadedChunks.has(this.chunkIndex)) {
        console.log(
          `Preparing to upload chunk ${this.chunkIndex + 1}/${totalChunks}`,
        );
        try {
          const chunk = await this.readChunk(CHUNK_SIZE);
          if (!chunk) {
            console.log("No more chunks to read, breaking loop");
            break;
          }

          console.log(`Uploading chunk ${this.chunkIndex + 1}/${totalChunks}`);
          const response = await this.uploadChunkWithRetry(
            chunk,
            this.chunkIndex,
            totalChunks,
          );
          if (
            response &&
            (this.chunkIndex === totalChunks - 1 || response.id)
          ) {
            finalResponse = response;
            break;
          }
        } catch (error) {
          console.error(
            `Error processing chunk ${this.chunkIndex + 1}:`,
            error,
          );
          throw error;
        }
      } else {
        console.log(
          `Chunk ${this.chunkIndex + 1}/${totalChunks} already uploaded, skipping`,
        );
      }

      this.chunkIndex++;
    }

    if (!finalResponse || !finalResponse.id) {
      console.log(`No final response received, fetching file info`);
      finalResponse = await this.getFileInfo();
    }

    console.log(`Streaming upload completed for ${this.fileName}`);
    return finalResponse || { id: "unknown" };
  }

  private async uploadChunkWithRetry(
    chunk: Buffer,
    index: number,
    totalChunks: number,
  ): Promise<any> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const response = await this.uploadChunk(chunk, index, totalChunks);
        this.uploadedChunks.add(index);
        return response;
      } catch (error: any) {
        if (error.status === 416) {
          console.log(
            `Chunk ${index + 1}/${totalChunks} already uploaded, skipping`,
          );
          this.uploadedChunks.add(index);
          return null;
        }
        retries++;
        console.warn(
          `Retry ${retries}/${this.maxRetries} for chunk ${index + 1}/${totalChunks}`,
        );
        if (retries === this.maxRetries) {
          throw error;
        }
      }
    }
    return null;
  }

  cancel(): void {
    this.isCancelled = true;
  }

  private async cancelUpload(): Promise<void> {
    if (this.uploadUrl) {
      try {
        await fetch(this.uploadUrl, { method: "DELETE" });
        console.log(`Upload session cancelled for ${this.fileName}`);
      } catch (error) {
        console.error(`Error cancelling upload session: ${error}`);
      }
    }
  }

  private async readChunk(size: number): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const chunk = (this.fileStream as any).read(size);
      if (chunk === null) {
        this.fileStream.once("readable", () => {
          resolve(this.readChunk(size));
        });
        this.fileStream.once("end", () => {
          resolve(null);
        });
      } else {
        resolve(chunk);
      }
    });
  }

  private emitProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressUpdate > 1000) {
      // Update progress every second
      const progress: UploadProgress = {
        bytesUploaded: this.bytesUploaded,
        totalBytes: this.fileSize,
        percentage: (this.bytesUploaded / this.fileSize) * 100,
      };
      this.emit("progress", progress);
      this.lastProgressUpdate = now;
    }
  }

  private cleanup(): void {
    if (
      "destroy" in this.fileStream &&
      typeof (this.fileStream as any).destroy === "function"
    ) {
      (this.fileStream as any).destroy();
    }
    this.removeAllListeners();
    // @ts-ignore
    this.client = null;
    this.uploadedChunks.clear();
  }
}

export async function checkFileExists(
  accessToken: string,
  folderPath: string,
  fileName: string,
): Promise<boolean> {
  const path = folderPath === "/" ? fileName : `${folderPath}/${fileName}`;
  console.log(`Checking if file exists: ${path}`);
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      console.log(`File exists: ${folderPath}/${fileName}`);
      return true; // File exists
    } else if (response.status === 404) {
      console.log(`File does not exist: ${folderPath}/${fileName}`);
      return false; // File does not exist
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error checking file existence:", error);

    // Try to refresh the token
    try {
      const refreshResponse = await fetch("/api/refresh", { method: "GET" });
      if (refreshResponse.ok) {
        console.log("Token refreshed successfully");
        return false;
      } else {
        console.error("Failed to refresh token");
      }
    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError);
    }

    throw error;
  }
}
