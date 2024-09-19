import express from "express";
import next from "next";
import { NextServer } from "next/dist/server/next";
import busboy from "busboy";
import {
  checkFileExists,
  UploadHandler,
  UploadProgress,
} from "./uploadHandler";
import { getServerTokens } from "./src/lib/getServerTokens";
import { prisma } from "./src/lib/prisma";
import { Readable, PassThrough } from "stream";

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
    let mimeType: string = "";
    const uploadPath = req.query.path as string;
    const silent = req.query.silent === "true";
    let uploader: UploadHandler | null = null;

    if (!uploadPath) {
      return res.status(400).json({ error: "Upload path is required" });
    }

    bb.on("file", async (name, file, info) => {
      fileName = info.filename;
      mimeType = info.mimeType;

      try {
        let tokens = await getServerTokens();
        if (!tokens) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        const { accessToken } = tokens;

        const fileExists = await checkFileExists(
          accessToken,
          uploadPath === "/" ? "" : uploadPath,
          fileName,
        );

        if (fileExists) {
          res
            .status(409)
            .json({ error: "File already exists in the destination folder" });
          return;
        }

        // Calculate file size while streaming
        let fileSize = 0;
        const chunks: Buffer[] = [];

        for await (const chunk of file) {
          fileSize += chunk.length;
          chunks.push(chunk);
        }

        console.log(`File size calculated: ${fileSize} bytes`);

        // Create a new readable stream from the accumulated chunks
        const resetableStream = new Readable({
          read() {
            chunks.forEach((chunk) => this.push(chunk));
            this.push(null);
          },
        });

        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
        });

        if (!silent) {
          res.write(`Starting upload of ${fileName} to ${uploadPath}\n`);
        }

        uploader = new UploadHandler(
          accessToken,
          resetableStream,
          fileName,
          fileSize,
          mimeType,
          uploadPath,
        );

        uploader.on("progress", (progress: UploadProgress) => {
          if (!silent) {
            res.write(`Progress: ${progress.percentage.toFixed(2)}%\n`);
          }
        });

        try {
          const result = await uploader.upload();

          if (result && result.status === "completed") {
            res.end(JSON.stringify(result));
          } else if (result && result.status === "cancelled") {
            res.write(`Upload cancelled for: ${fileName}\n`);
            res.end(JSON.stringify(result));
          } else {
            throw new Error(
              `Unexpected upload result: ${JSON.stringify(result)}`,
            );
          }
        } catch (error: any) {
          console.error("Upload error:", error);
          res.write(
            JSON.stringify({
              error: "Upload failed",
              message: error.message,
            }),
          );
          res.end();
        } finally {
          if (uploader) {
            uploader.removeAllListeners();
            uploader = null;
          }
        }
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

    req.pipe(bb);

    req.on("close", () => {
      bb.removeAllListeners();
    });
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
    const serverInstance = await startServer(DEFAULT_PORT);

    // Garbage collection: Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      serverInstance.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
  } catch (error: any) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});
