const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "dist");
const argPort = process.argv.find(arg => /^--port=/.test(arg))?.split("=")[1] || process.argv[2];
const port = Number(argPort || process.env.PORT || 4186);
const host = "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  const requested = decodeURIComponent(url.pathname);
  const cleanPath = requested === "/" ? "/index.html" : requested;
  const filePath = path.normalize(path.join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      send(res, 200, data, types[path.extname(filePath)] || "application/octet-stream");
      return;
    }

    fs.readFile(path.join(root, "index.html"), (fallbackErr, fallback) => {
      if (fallbackErr) send(res, 404, "Build output not found. Run the production build first.");
      else send(res, 200, fallback, types[".html"]);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Earned local test server running at http://${host}:${port}/`);
});
