const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => {
  const file = path.join(root, ...parts);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
};

const app = read("src", "App.jsx");
const main = read("src", "main.jsx");
const html = read("index.html");
const manifest = read("public", "manifest.webmanifest");
const serviceWorker = read("public", "sw.js");
const readme = read("README.md");
const css = read("src", "styles.css");

const checks = [
  [html, 'rel="manifest" href="/manifest.webmanifest"', "index.html manifest link"],
  [html, 'name="theme-color" content="#050505"', "index.html theme color"],
  [main, 'import.meta.env.PROD', "production-only registration guard"],
  [main, 'navigator.serviceWorker.register("/sw.js")', "service-worker registration"],
  [app, "function ConnectionStatus({isOnline,hasDraft})", "ConnectionStatus component"],
  [app, "const [isOnline,setIsOnline]=useState(()=>navigator.onLine);", "online state"],
  [app, 'window.addEventListener("online",handleOnline)', "online listener"],
  [app, 'window.addEventListener("offline",handleOffline)', "offline listener"],
  [app, "Offline Draft", "offline draft copy"],
  [app, "<ConnectionStatus isOnline={isOnline} hasDraft={!!draft}/>", "header integration"],
  [app, 'className="earned-app-header__account"', "mobile-safe status rail integration"],
  [css, ".earned-app-header__account", "mobile-safe status rail styles"],
  [css, "flex-wrap: wrap", "mobile-safe status wrapping"],
  [manifest, '"display": "standalone"', "standalone manifest"],
  [manifest, '"start_url": "/"', "manifest start URL"],
  [manifest, '"src": "/lift-icon.svg"', "manifest icon"],
  [manifest, '"src": "/lift-icon-192.png"', "192px install icon"],
  [manifest, '"src": "/lift-icon-512.png"', "512px install icon"],
  [serviceWorker, 'const CACHE_NAME = "earned-app-shell-v1";', "versioned cache"],
  [serviceWorker, 'request.method !== "GET"', "GET-only cache"],
  [serviceWorker, 'url.hostname.endsWith(".supabase.co")', "Supabase cache exclusion"],
  [serviceWorker, 'request.mode === "navigate"', "navigation fallback"],
  [serviceWorker, 'caches.match("/")', "offline app-shell fallback"],
  [readme, "Installable Offline App Shell", "README offline feature"],
];

const missing = checks.filter(([source, fragment]) => !source.includes(fragment));
if (missing.length) {
  console.error("Offline App Shell verification failed:");
  for (const [, , label] of missing) console.error(`- Missing ${label}`);
  process.exit(1);
}

console.log("Offline App Shell verification passed.");
