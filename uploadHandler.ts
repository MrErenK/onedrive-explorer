import { Client } from "@microsoft/microsoft-graph-client";
import { Readable } from "stream";
import { EventEmitter } from "events";

const INITIAL_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB initial chunk size
const MIN_CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB minimum chunk size
const MAX_CHUNK_SIZE = 60 * 1024 * 1024; // 60 MB maximum chunk size
const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024; // 4 MB threshold for small files

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

export class UploadHandler extends EventEmitter {
  private client: Client;
  private uploadSession: any;
  private fullPath: string;
  private bytesUploaded: number = 0;
  private lastProgressUpdate: number = 0;
  private chunkSize: number = INITIAL_CHUNK_SIZE;
  private uploadStartTime: number = 0;

  constructor(
    private accessToken: string,
    private fileStream: Readable,
    private fileName: string,
    private fileSize: number,
    private mimeType: string,
    private uploadPath: string,
  ) {
    super();
    this.fullPath = `${uploadPath}/${fileName}`;
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    console.log(
      `UploadHandler initialized with file size: ${this.fileSize} bytes`,
    );
  }

  async initializeUpload(): Promise<void> {
    this.uploadSession = await this.client
      .api(`/me/drive/root:/${this.fullPath}:/createUploadSession`)
      .post({});
  }

  async uploadSmallFile(): Promise<any> {
    console.log(
      `Uploading small file: ${this.fileName} (${this.fileSize} bytes)`,
    );
    const fileContent = await this.readEntireFile();
    const response = await this.client
      .api(`/me/drive/root:/${this.fullPath}:/content`)
      .put(fileContent);
    console.log("Small file upload completed");
    return response;
  }

  async upload(): Promise<any> {
    try {
      if (this.fileSize <= SMALL_FILE_THRESHOLD) {
        return await this.uploadSmallFile();
      }

      await this.initializeUpload();
      await this.uploadChunks();

      const uploadedFile = await this.client
        .api(`/me/drive/root:/${this.fullPath}`)
        .get();
    } catch (error) {
      console.error("Error in upload process:", error);
      throw error;
    }
  }

  private async uploadChunk(start: number, end: number): Promise<any> {
    const isLastChunk = end === this.fileSize;
    const contentRange = `bytes ${start}-${end - 1}/${this.fileSize}`;
    const chunkSize = end - start;

    try {
      const chunkBuffer = await this.readChunk(start, chunkSize);

      const response = await fetch(this.uploadSession.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": chunkBuffer.length.toString(),
          "Content-Range": contentRange,
        },
        body: chunkBuffer,
      });

      if (!response.ok) {
        throw new Error(
          `Upload chunk failed: ${response.status} ${response.statusText}`,
        );
      }

      const responseData = await response.json();

      if (isLastChunk) {
        if (responseData.size !== undefined) {
          console.log(
            `Upload completed. Total size: ${responseData.size} bytes`,
          );
        } else {
          console.log(
            "Last chunk uploaded, but size not provided in response.",
          );
        }
      }

      return responseData;
    } catch (error) {
      console.error(`Error uploading chunk: ${(error as Error).message}`);
      throw error;
    }
  }

  private async uploadChunks(): Promise<void> {
    this.uploadStartTime = Date.now();
    while (this.bytesUploaded < this.fileSize) {
      const chunkStart = this.bytesUploaded;
      let chunkEnd = Math.min(chunkStart + this.chunkSize, this.fileSize);

      try {
        const chunkStartTime = Date.now();
        const response = await this.uploadChunkWithRetry(chunkStart, chunkEnd);
        const chunkEndTime = Date.now();

        this.bytesUploaded = chunkEnd;
        this.emitProgress();

        if (chunkEnd < this.fileSize) {
          this.adjustChunkSize(
            chunkEnd - chunkStart,
            chunkEndTime - chunkStartTime,
          );
        } else {
          console.log("Final chunk uploaded successfully.");
          break;
        }

        // Check if we need to upload one more chunk
        if (this.fileSize - this.bytesUploaded <= this.chunkSize) {
          // Force one more iteration to upload the last chunk
          this.chunkSize = this.fileSize - this.bytesUploaded;
        }
      } catch (error) {
        console.error(`Error uploading chunk: ${(error as Error).message}`);
        throw error;
      }
    }

    if (this.bytesUploaded === this.fileSize) {
      console.log("Upload completed successfully.");
    } else {
      console.log(
        `Upload incomplete. Uploaded ${this.bytesUploaded}/${this.fileSize} bytes.`,
      );
      throw new Error("Upload incomplete");
    }
  }

  private adjustChunkSize(bytesUploaded: number, uploadTime: number): void {
    const uploadSpeedMBps = (bytesUploaded / uploadTime / 1024 / 1024) * 1000;

    if (uploadSpeedMBps > 5) {
      this.chunkSize = Math.min(this.chunkSize * 1.5, MAX_CHUNK_SIZE);
    } else if (uploadSpeedMBps < 1) {
      this.chunkSize = Math.max(this.chunkSize / 1.5, MIN_CHUNK_SIZE);
    }
  }

  private async uploadChunkWithRetry(
    start: number,
    end: number,
    retries: number = 3,
  ): Promise<any> {
    if (start === end) {
      console.log("Skipping zero-byte chunk");
      return; // Skip uploading zero-byte chunks
    }

    try {
      return await this.uploadChunk(start, end);
    } catch (error) {
      if (retries > 0) {
        const delay = Math.pow(2, 4 - retries) * 1000; // Exponential backoff
        console.log(
          `Retrying chunk upload in ${delay}ms. Retries left: ${retries - 1}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.uploadChunkWithRetry(start, end, retries - 1);
      } else {
        throw error;
      }
    }
  }

  private emitProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressUpdate > 5000) {
      // Update progress every 5 seconds
      const progress: UploadProgress = {
        bytesUploaded: this.bytesUploaded,
        totalBytes: this.fileSize,
        percentage: (this.bytesUploaded / this.fileSize) * 100,
      };
      this.emit("progress", progress);
      this.lastProgressUpdate = now;
      console.log(`Upload progress: ${progress.percentage.toFixed(2)}%`);
    }
  }

  private async readChunk(start: number, size: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunk = Buffer.alloc(size);
      let bytesRead = 0;

      const readNextChunk = () => {
        const readSize = Math.min(size - bytesRead, 16384); // Read in 16KB chunks
        const buffer = this.fileStream.read(readSize);

        if (buffer) {
          buffer.copy(chunk, bytesRead);
          bytesRead += buffer.length;

          if (bytesRead < size) {
            readNextChunk();
          } else {
            resolve(chunk);
          }
        } else if (this.fileStream.readableEnded) {
          // Stream has ended
          if (bytesRead > 0) {
            resolve(chunk.slice(0, bytesRead));
          } else {
            reject(new Error("Unexpected end of file"));
          }
        } else {
          // Wait for more data
          this.fileStream.once("readable", readNextChunk);
        }
      };

      readNextChunk();
    });
  }

  private async readEntireFile(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.fileStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      this.fileStream.on("error", (err) => reject(err));
      this.fileStream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export async function uploadToOneDrive(
  accessToken: string,
  fileStream: Readable,
  fileName: string,
  fileSize: number,
  mimeType: string,
  uploadPath: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<any> {
  console.log(`Starting upload process for ${fileName} (${fileSize} bytes)`);
  const uploader = new UploadHandler(
    accessToken,
    fileStream,
    fileName,
    fileSize,
    mimeType,
    uploadPath,
  );

  if (onProgress) {
    uploader.on("progress", onProgress);
  }

  try {
    const result = await uploader.upload();
    console.log(`Upload completed for ${fileName}`);
    return result;
  } catch (error) {
    console.error("Error in uploadToOneDrive:", error);
    throw error;
  }
}

export async function checkFileExists(
  accessToken: string,
  folderPath: string,
  fileName: string,
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}/${fileName}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      return true; // File exists
    } else if (response.status === 404) {
      return false; // File does not exist
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error checking file existence:", error);
    throw error;
  }
}
