import axios from "axios";
import { state } from "./state.js";
import { locations } from "./locations.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";
const ADD_MIN = 1;

function fmt(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function sendShiftSummary() {
  let lines = [];

  for (const loc of Object.values(locations)) {
    const s = state[loc.key];

    const render = (level, emoji, label) => {
      if (s.shiftStats[level].length === 0) return;

      lines.push(`${emoji} ${loc.groupName}: затримка ${label}:`);

      for (const e of s.shiftStats[level]) {
        if (!e.resolvedAt) {
          lines.push(` – ❌ після нагадування рівень не було поставлено`);
        } else {
          const min =
            Math.round((e.resolvedAt - e.reminderAt) / 60000) + ADD_MIN;
          lines.push(` – о ${fmt(e.reminderAt)} на ${min} хв`);
        }
      }
    };

    render("blue", "🔷", "синього");
    render("green", "✅", "зеленого");

    // очищаємо після звіту
    s.shiftStats.blue = [];
    s.shiftStats.green = [];
  }

  if (lines.length === 0) {
    await send("✅ За минулу зміну всі рівні було виставлено без затримок");
    return;
  }

  await send("📊 Підсумок за останню зміну:\n\n" + lines.join("\n"));
}

async function send(text) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    { chat_id: CHANNEL, text }
  );
}