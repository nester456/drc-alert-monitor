import axios from "axios";
import { state } from "./state.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";

export async function sendBlueReminder(locKey, groupName) {
  state[locKey].shiftStats.blue.push({
    reminderAt: Date.now(),
    resolvedAt: null
  });

  await send(
    `❗❗❗ Увага, ви не поставили 🔷 *синій* рівень тривоги в **${groupName}**`
  );
}

export async function sendGreenReminder(locKey, groupName) {
  state[locKey].shiftStats.green.push({
    reminderAt: Date.now(),
    resolvedAt: null
  });

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