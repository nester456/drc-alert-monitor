import axios from "axios";
import { state } from "./state.js";
import { locations } from "./locations.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";

// ⏱ додаємо +1 хвилину (бо рахуємо від reminder)
const ADD_MIN = 1;

export async function sendShiftSummary() {
  let lines = [];

  for (const loc of Object.values(locations)) {
    const s = state[loc.key];

    // 🔷 синій
    const b = s.shiftStats.blue;
    if (b.reminderAt) {
      if (!b.resolvedAt) {
        lines.push(
          `🔷 ${loc.groupName}: ❌ після нагадування рівень не було поставлено`
        );
      } else {
        const min =
          Math.round((b.resolvedAt - b.reminderAt) / 60000) + ADD_MIN;
        lines.push(
          `🔷 ${loc.groupName}: затримка синього на ${min} хв`
        );
      }
    }

    // ✅ зелений
    const g = s.shiftStats.green;
    if (g.reminderAt) {
      if (!g.resolvedAt) {
        lines.push(
          `✅ ${loc.groupName}: ❌ після нагадування рівень не було поставлено`
        );
      } else {
        const min =
          Math.round((g.resolvedAt - g.reminderAt) / 60000) + ADD_MIN;
        lines.push(
          `✅ ${loc.groupName}: затримка зеленого на ${min} хв`
        );
      }
    }

    // 🔄 очищаємо статистику ПІСЛЯ звіту
    s.shiftStats.blue = { reminderAt: null, resolvedAt: null };
    s.shiftStats.green = { reminderAt: null, resolvedAt: null };
  }

  if (lines.length === 0) {
    await send(
      "✅ За минулу зміну всі рівні було виставлено без затримок"
    );
    return;
  }

  const text =
    "📊 Підсумок за останню зміну:\n\n" +
    lines.join("\n");

  await send(text);
}

async function send(text) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHANNEL,
      text
    }
  );
}