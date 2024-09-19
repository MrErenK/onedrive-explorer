import express from "express";
import next from "next";
import { NextServer } from "next/dist/server/next";
import { Busboy, BusboyHeaders } from "@fastify/busboy";
import {
  checkFileExists,
  UploadHandler,
  UploadProgress,
} from "./uploadHandler";
import { getServerTokens } from "./src/lib/getServerTokens";
import { prisma } from "./src/lib/prisma";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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
    const bb = new Busboy({ headers: req.headers as BusboyHeaders });
    let fileName: string = "";
    let mimeType: string = "";
    const uploadPath = req.query.path as string;
    const silent = req.query.silent === "true";
    let uploader: UploadHandler | null = null;

    if (!uploadPath) {
      return res.status(400).json({ error: "Upload path is required" });
    }

    bb.on(
      "file",
      async (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        fileName = filename;
        mimeType = mimetype;

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

          console.log(`Starting upload of ${fileName} to ${uploadPath}`);

          res.writeHead(200, {
            "Content-Type": "text/plain",
            "Transfer-Encoding": "chunked",
          });

          if (!silent) {
            res.write(`Starting upload of ${fileName} to ${uploadPath}\n`);
          }

          // Create a temporary file to store the incoming data
          const tempFilePath = path.join(
            os.tmpdir(),
            `upload-${Date.now()}-${fileName}`,
          );
          const writeStream = fs.createWriteStream(tempFilePath);

          file.pipe(writeStream);

          writeStream.on("finish", async () => {
            const stats = fs.statSync(tempFilePath);
            const fileSize = stats.size;

            const readStream = fs.createReadStream(tempFilePath);

            uploader = new UploadHandler(
              accessToken,
              readStream,
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
                res.write(
                  `Upload completed: ${fileName} (${fileSize} bytes)\n`,
                );
                res.end(JSON.stringify({ ...result, fileSize }));

                // Clean up the temporary file
                fs.unlink(tempFilePath, (err) => {
                  if (err) console.error("Error deleting temporary file:", err);
                });
              } else if (result && result.status === "cancelled") {
                res.write(`Upload cancelled for: ${fileName}\n`);
                res.end(JSON.stringify({ ...result, fileSize }));
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
              // Clean up the temporary file
              fs.unlink(tempFilePath, (err) => {
                if (err) console.error("Error deleting temporary file:", err);
              });
            }
          });

          writeStream.on("error", (error) => {
            console.error("Error writing to temporary file:", error);
            res.status(500).json({ error: "Failed to process upload" });
            fs.unlink(tempFilePath, (err) => {
              if (err) console.error("Error deleting temporary file:", err);
            });
          });
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
      },
    );

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
