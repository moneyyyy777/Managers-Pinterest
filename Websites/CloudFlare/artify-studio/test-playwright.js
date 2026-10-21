import { chromium } from "playwright";
(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log("Connected to Chrome via CDP successfully!");
    process.exit(0);
  } catch(e) {
    console.error("Failed to connect:", e.message);
    process.exit(1);
  }
})();
