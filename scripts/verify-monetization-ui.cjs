const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("src/App.jsx");

const expectedFiles = [
  "src/components/monetization/PricingView.jsx",
  "src/components/monetization/PremiumGate.jsx",
  "src/components/monetization/UpgradePrompt.jsx",
  "src/components/monetization/InviteTrainingPartner.jsx",
  "src/components/monetization/RecoveryIntegrationPreview.jsx",
];
for (const file of expectedFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing monetization UI file: ${file}`);
}

const pricing = read(expectedFiles[0]);
const gate = read(expectedFiles[1]);
const prompt = read(expectedFiles[2]);
const invite = read(expectedFiles[3]);
const recoveryPreview = read(expectedFiles[4]);
const planCatalog = read("src/monetization/plans.js");
const pricingContract = `${pricing}\n${planCatalog}`;

const appFragments = [
  "PricingView",
  "PremiumGate",
  "UpgradePrompt",
  "createFreeSubscription",
  "createPreviewSubscription",
  "resolveFeatureAccess",
  "FEATURE_IDS.ADVANCED_ANALYTICS",
  "FEATURE_IDS.PROGRAM_PACKS",
  "MONETIZATION_MODES.PREVIEW",
  "pricingOpen",
  "showPostWorkoutUpgrade",
  "InviteTrainingPartner",
  "RecoveryIntegrationPreview",
  "FEATURE_IDS.RECOVERY_INTEGRATIONS",
];
for (const fragment of appFragments) {
  if (!app.includes(fragment)) throw new Error(`App monetization integration is missing: ${fragment}`);
}

const monetizationUi = `${app}\n${pricing}\n${gate}\n${prompt}`;
for (const fragment of ["Explore Premium", "Premium Preview"]) {
  if (!monetizationUi.includes(fragment)) throw new Error(`Monetization UI is missing: ${fragment}`);
}

for (const fragment of [
  "Monthly",
  "Annual",
  "$19.99",
  "Payments are not live yet",
  "Use Premium Preview",
  "Everything needed to train",
  "Train with clarity, not guesswork",
]) {
  if (!pricingContract.includes(fragment)) throw new Error(`Pricing copy is missing: ${fragment}`);
}

for (const forbidden of ["payment successful", "purchase complete", "you are subscribed", "Subscribe now"]) {
  if (pricing.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Pricing UI makes an unsupported payment claim: ${forbidden}`);
  }
}

if (!/access\??\.allowed/.test(gate) || !gate.includes("earned-premium-gate--locked")) {
  throw new Error("PremiumGate does not handle allowed and locked states");
}
if (!prompt.includes("onDismiss") || !prompt.includes("Explore Premium")) {
  throw new Error("UpgradePrompt must be contextual and dismissible");
}
for (const fragment of ["Invite a training partner", "navigator.share", "navigator.clipboard"]) {
  if (!invite.includes(fragment)) throw new Error(`Training-partner invitation is missing: ${fragment}`);
}
for (const fragment of ["Recovery signals", "Sleep", "HRV", "Readiness", "Not connected"]) {
  if (!recoveryPreview.includes(fragment)) throw new Error(`Recovery preview is missing: ${fragment}`);
}
if (/Connect Now|Sync complete|Live HRV/i.test(recoveryPreview)) {
  throw new Error("Recovery preview claims an integration that does not exist");
}

const saveAllBlock = app.slice(app.indexOf("const saveAll="), app.indexOf("const handleSaveDraft="));
if (saveAllBlock.includes("subscription")) {
  throw new Error("Subscription state must not be written through workout-data persistence");
}

if (!app.includes("const accountContext={username:authUser.username};")) {
  throw new Error("Premium access must include the authenticated account context");
}
const accountContextUses = (app.match(/\n\s+accountContext,\n/g) || []).length;
if (accountContextUses < 3) {
  throw new Error("Every current Premium gate must receive the authenticated account context");
}

console.log("Monetization pricing and gate UI verified.");
