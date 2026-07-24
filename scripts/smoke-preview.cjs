const { spawn } = require("child_process");

const port = String(process.argv[2] || "4194");
const url = `http://127.0.0.1:${port}/`;
const requiredPaths = [
  "/",
  "/manifest.webmanifest",
  "/sw.js",
  "/lift-icon.svg",
  "/lift-icon-192.png",
  "/lift-icon-512.png",
];
const viteArgs = [
  "node_modules/vite/bin/vite.js",
  "preview",
  "--host",
  "127.0.0.1",
  "--port",
  port,
  "--strictPort",
];

const preview = spawn(process.execPath, viteArgs, {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
let stopping = false;
preview.stdout.on("data", chunk => { output += chunk; });
preview.stderr.on("data", chunk => { output += chunk; });

const startedAt = Date.now();
const timeoutMs = 10000;

async function stop(code, message) {
  if (stopping) return;
  stopping = true;
  console.log(message);
  if (code && output.trim()) console.error(output.trim());
  process.exitCode = code;
  if (preview.exitCode !== null || preview.signalCode !== null) return;
  await new Promise(resolve => {
    preview.once("close", resolve);
    preview.kill();
  });
}

async function poll() {
  try {
    const responses = await Promise.all(requiredPaths.map(async path => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      return { path, status: response.status };
    }));
    if (responses.every(response => response.status === 200)) {
      const summary = responses.map(response => `${response.path}=${response.status}`).join(", ");
      await stop(0, `Preview smoke status: ${summary} at ${url}`);
      return;
    }
  } catch {
    // Vite may still be starting. Poll until the bounded timeout.
  }

  if (Date.now() - startedAt >= timeoutMs) {
    await stop(1, `Preview smoke failed to reach ${url} within ${timeoutMs}ms.`);
    return;
  }
  setTimeout(poll, 250);
}

preview.on("exit", code => {
  if (stopping) return;
  if (Date.now() - startedAt < timeoutMs && code !== null && code !== 0) {
    console.error(`Preview exited before the smoke check completed with code ${code}.`);
    if (output.trim()) console.error(output.trim());
    process.exit(code || 1);
  }
});

poll();
