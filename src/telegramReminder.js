import axios from "axios";
import { state } from "./state.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";

export async function sendBlueReminder(locKey, groupName) {
  const s = state[locKey];

  // фіксуємо перше нагадування за зміну
  if (!s.shiftStats.blue.reminderAt) {
    s.shiftStats.blue.reminderAt = Date.now();
  }

  await send(
    `❗❗❗ Увага, ви не поставили 🔷 *синій* рівень тривоги в **${groupName}**`
  );
}

export async function sendGreenReminder(locKey, groupName) {
  const s = state[locKey];

  if (!s.shiftStats.green.reminderAt) {
    s.shiftStats.green.reminderAt = Date.now();
  }

  await send(
    `❗❗❗ Увага, ви не поставили ✅ *зелений* рівень тривоги в **${groupName}**`
  );
}

async function send(text) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHANNEL,
      text,
      parse_mode: "Markdown"
    }
  );
}