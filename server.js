import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toNodeHandler } from "srvx/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = path.resolve(__dirname, "dist", "client");
const SERVER_ENTRY = path.resolve(__dirname, "dist", "server", "server.js");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

async function start() {
  if (!fs.existsSync(SERVER_ENTRY)) {
    console.error(
      `Server build not found at ${SERVER_ENTRY}. Run 'npm run build' first.`,
    );
    process.exit(1);
  }

  const serverModule = await import(SERVER_ENTRY);
  const startHandler = serverModule.default;
  if (!startHandler || typeof startHandler.fetch !== "function") {
    console.error(
      "Invalid server bundle: expected default export with fetch method.",
    );
    process.exit(1);
  }

  const nodeSsrHandler = toNodeHandler((webReq) => startHandler.fetch(webReq));

  const server = http.createServer((req, res) => {
    // 1. Try static asset from dist/client
    const rawUrl = req.url || "/";
    let pathname = "/";
    try {
      pathname = decodeURIComponent(rawUrl.split("?")[0]);
    } catch {
      pathname = rawUrl.split("?")[0];
    }

    // Disallow directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(CLIENT_DIR, safePath);

    if (filePath.startsWith(CLIENT_DIR) && fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";

          // Cache immutable assets aggressively
          if (pathname.startsWith("/assets/")) {
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable",
            );
          } else {
            res.setHeader("Cache-Control", "public, max-age=3600");
          }

          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", stat.size);

          if (req.method === "HEAD") {
            res.end();
            return;
          }

          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch (err) {
        console.error("Error serving static file:", err);
      }
    }

    // 2. Delegate SSR & API routes to TanStack Start fetch handler
    nodeSsrHandler(req, res);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  server.listen(PORT, HOST, () => {
    console.log(`Production server running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
