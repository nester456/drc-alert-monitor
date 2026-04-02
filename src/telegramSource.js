import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

import { TELEGRAM_SOURCE_CHANNEL } from "./config.js";
import { locations } from "./locations.js";
import {
  onTelegramAlert,
  onTelegramClear
} from "./logic.js";

let lastId = null;

export async function startTelegramSource() {
  const client = new TelegramClient(
    new StringSession(process.env.SESSION),
    Number(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 5 }
  );

  // ✅ ВАЖЛИВО: тільки connect, без start
  await client.connect();

  console.log("✅ Telegram source ready");

  // 🔐 Ініціалізація — беремо останнє повідомлення
  const init = await client.getMessages(
    TELEGRAM_SOURCE_CHANNEL,
    { limit: 1 }
  );

  if (init.length > 0) {
    lastId = init[0].id;
    console.log("🔐 Telegram initialized at message", lastId);
  }

  // 🔁 polling кожні 30 сек
  setInterval(async () => {
    try {
      const messages = await client.getMessages(
        TELEGRAM_SOURCE_CHANNEL,
        { limit: 10 }
      );

      for (const m of messages.reverse()) {
        if (!m.message) continue;
        if (lastId !== null && m.id <= lastId) continue;

        lastId = m.id;
        const text = m.message.toLowerCase();

        const matched = new Set();

        for (const loc of Object.values(locations)) {
          if (matched.has(loc.key)) continue;

          const hit = loc.aliases.some(a =>
            text.includes(a.toLowerCase())
          );
          if (!hit) continue;

          matched.add(loc.key);

          // 🔴 ТРИВОГА
          if (text.includes("повітряна тривога")) {
            console.log(
              "📡 TELEGRAM ALERT:",
              loc.key,
              "→",
              loc.groupName
            );

            onTelegramAlert(loc.key, loc.groupName);
          }

          // 🟢 ВІДБІЙ
          if (text.includes("відбій тривоги")) {
            console.log(
              "📡 TELEGRAM CLEAR:",
              loc.key,
              "→",
              loc.groupName
            );

            onTelegramClear(loc.key, loc.groupName);
          }
        }
      }
    } catch (err) {
      console.error("❌ Telegram polling error:", err.message);
    }
  }, 30_000);
}