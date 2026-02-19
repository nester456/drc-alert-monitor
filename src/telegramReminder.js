import axios from "axios";
import { stats } from "./stats.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const REMINDER_CHANNEL = "-1003719282039";

export async function sendBlueReminder(locKey, groupName) {
  stats.blue.push({ locKey, ts: Date.now() });

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: REMINDER_CHANNEL,
      text: `❗ Увага, ви не поставили 🔷 синій рівень тривоги в ${groupName}`
    }
  );
}

export async function sendGreenReminder(locKey, groupName) {
  stats.green.push({ locKey, ts: Date.now() });

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: REMINDER_CHANNEL,
      text: `❗ Увага, ви забули поставити ✅ зелений рівень тривоги в ${groupName}`
    }
  );
}