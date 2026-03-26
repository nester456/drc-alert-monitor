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
    minute: "2-digit",
    timeZone: "Europe/Kyiv"
  });
}

export async function sendShiftSummary() {
  let lines = [];

  for (const loc of Object.values(locations)) {
    const s = state[loc.key];

    const render = (level, emoji, label) => {
      const events = s.shiftStats[level].filter(e => !e.closed);

      if (events.length === 0) return;

      lines.push(`${emoji} ${loc.groupName}: затримка ${label}:`);

      for (const e of events) {

        if (!e.resolvedAt) {
         let line = ` – о ${fmt(e.reminderAt)} ❌ рівень не було поставлено`;

if (e.levelAtReminder === "red") {
  line += `, однак в цей час був червоний рівень`;
}

lines.push(line);
        } else {
          const min =
            Math.round((e.resolvedAt - e.reminderAt) / 60000) + ADD_MIN;

          let line = ` – о ${fmt(e.reminderAt)} на ${min} хв`;

if (e.levelAtReminder === "red") {
  line += `, однак в цей час був червоний рівень`;
}

lines.push(line);
        }

      }
    };

    render("blue", "🔷", "синього");
    render("green", "✅", "зеленого");

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
    {
      chat_id: CHANNEL,
      text
    }
  );
}