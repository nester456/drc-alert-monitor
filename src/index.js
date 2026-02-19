import "dotenv/config";
import { startWhatsApp } from "./whatsapp.js";
import { startTelegramSource } from "./telegramSource.js";
import "./scheduler.js";

console.log("🚀 DRC ALERT MONITOR v2 starting");

await startWhatsApp();
await startTelegramSource();