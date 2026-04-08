import "dotenv/config";
import { startWhatsApp } from "./whatsapp.js";
// import { startTelegramSource } from "./telegramSource.js";
import "./scheduler.js";

console.log("🚀 LOCAL WHATSAPP LOGIN");

// 🔥 ТІЛЬКИ WhatsApp (щоб не зламати Telegram сесію)
await startWhatsApp();

// ❌ Тимчасово вимкнено
// await startTelegramSource();