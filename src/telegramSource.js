import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

import { TELEGRAM_SOURCE_CHANNEL } from "./config.js";
import { locations } from "./locations.js";
import {
  onTelegramAlert,
  onTelegramClear
} from "./logic.js";

export async function startTelegramSource() {
  const client = new TelegramClient(
    new StringSession(process.env.TG_STRING_SESSION),
    Number(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 5 }
  );

  await client.start();
  console.log("✅ Telegram source ready");

  let lastId = 0;

  setInterval(async () => {
    const messages = await client.getMessages(
      TELEGRAM_SOURCE_CHANNEL,
      { limit: 5 }
    );

    for (const m of messages.reverse()) {
      if (!m.message || m.id <= lastId) continue;
      lastId = m.id;

      const text = m.message.toLowerCase();

      for (const loc of Object.values(locations)) {
        const hit = loc.aliases.some(alias =>
          text.includes(alias.toLowerCase())
        );
        if (!hit) continue;

        // 🔷 ПОВІТРЯНА ТРИВОГА
        if (text.includes("повітряна тривога")) {
          console.log(
            "📡 TELEGRAM ALERT MATCH:",
            loc.key,
            "→",
            loc.groupName
          );

          onTelegramAlert(loc.key, loc.groupName);
        }

        // ✅ ВІДБІЙ
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