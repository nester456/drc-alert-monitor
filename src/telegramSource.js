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
    new StringSession(process.env.TG_STRING_SESSION),
    Number(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 5 }
  );

  await client.start();
  console.log("✅ Telegram source ready");

  // 🔐 ІНІЦІАЛІЗАЦІЯ:
  // при старті запамʼятовуємо ОСТАННЄ повідомлення
  // і НЕ реагуємо на минулі події
  const init = await client.getMessages(
    TELEGRAM_SOURCE_CHANNEL,
    { limit: 1 }
  );

  if (init.length > 0) {
    lastId = init[0].id;
    console.log("🔐 Telegram initialized at message", lastId);
  }

  setInterval(async () => {
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

        if (text.includes("повітряна тривога")) {
          console.log(
            "📡 TELEGRAM ALERT MATCH:",
            loc.key,
            "→",
            loc.groupName
          );
          onTelegramAlert(loc.key, loc.groupName);
        }

        if (text.includes("відбій тривоги")) {
          console.log(
            "📡 TELEGRAM CLEAR MATCH:",
            loc.key,
            "→",
            loc.groupName
          );
          onTelegramClear(loc.key, loc.groupName);
        }
      }
    }
  }, 30_000);
}