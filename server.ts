import express from "express";
import next from "next";
import { NextServer } from "next/dist/server/next";
import busboy from "busboy";
import { Readable } from "stream";
import {
  checkFileExists,
  UploadHandler,
  UploadProgress,
} from "./uploadHandler";
import { getServerTokens } from "./src/lib/getServerTokens";
import { prisma } from "./src/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const app: NextServer = next({ dev });
const handle = app.getRequestHandler();

const DEFAULT_PORT = 3000;
const MAX_PORT = 3020;

app.prepare().then(async () => {
  const server = express();

  // Middleware to check API key
  const checkApiKey = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey) {
      return res.status(401).json({ error: "API key is required" });
    }

    const validApiKey = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });
    if (!validApiKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    next();
  };

  // Use Express only for the upload API route
  server.post("/api/upload", checkApiKey, async (req, res) => {
    const bb = busboy({ headers: req.headers });
    let fileName: string = "";
    let fileSize: number = 0;
    let mimeType: string = "";
    const uploadPath = req.query.path as string;

    if (!uploadPath) {
      return res.status(400).json({ error: "Upload path is required" });
    }

    bb.on("file", async (name, file, info) => {
      fileName = info.filename;
      mimeType = info.mimeType;

      // Initialize fileSize to 0
      fileSize = 0;

      // Calculate file size and collect file data
      const chunks: Buffer[] = [];
      file.on("data", (data) => {
        chunks.push(data);
        fileSize += data.length;
      });

      file.on("end", async () => {
        try {
          let tokens = await getServerTokens();
          if (!tokens) {
            res.status(401).json({ error: "Unauthorized" });
            return;
          }

          const { accessToken } = tokens;

          const fileExists = await checkFileExists(
            accessToken,
            uploadPath,
            fileName,
          );
          if (fileExists) {
            res
              .status(409)
              .json({ error: "File already exists in the destination folder" });
            return;
          }

          res.writeHead(200, {
            "Content-Type": "text/plain",
            "Transfer-Encoding": "chunked",
          });

          res.write(`Starting upload of ${fileName} to ${uploadPath}\n`);

          // Create a new readable stream from the collected chunks
          const fileBuffer = Buffer.concat(chunks);
          const fileStream = new Readable();
          fileStream.push(fileBuffer);
          fileStream.push(null);

          const uploader = new UploadHandler(
            accessToken,
            fileStream,
            fileName,
            fileSize,
            mimeType,
            uploadPath,
          );

          uploader.on("progress", (progress: UploadProgress) => {
            res.write(`Progress: ${progress.percentage.toFixed(2)}%\n`);
          });

          uploader.on("canceled", (fileName: string) => {
            res.write(`Upload of ${fileName} has been canceled or stopped.\n`);
          });

          const result = await uploader.upload();

          res.write(`Upload completed for: ${fileName} to ${uploadPath}\n`);
          res.end(JSON.stringify(result));
        } catch (error: any) {
          console.error("Upload error:", error);
          res.write(
            JSON.stringify({
              error: "Upload failed",
              message: error.message,
            }),
          );
          res.end();
        }
      });
    });

    req.pipe(bb);
  });

  // Handle all other routes with Next.js
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Try to start the server on available ports
  const startServer = (port: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(port, (err?: Error) => {
        if (err) {
          serverInstance.close();
          if (port < MAX_PORT) {
            resolve(startServer(port + 1));
          } else {
            reject(new Error("No available ports found"));
          }
        } else {
          console.log(`> Ready on http://localhost:${port}`);
          resolve(serverInstance);
        }
      });

      serverInstance.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          serverInstance.close();
          if (port < MAX_PORT) {
            resolve(startServer(port + 1));
          } else {
            reject(new Error("No available ports found"));
          }
        } else {
          reject(err);
        }
      });
    });
  };

  try {
    await startServer(DEFAULT_PORT);
  } catch (error: any) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});
