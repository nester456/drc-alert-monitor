import axios from "axios";
import { stats } from "./stats.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";

// 12 годин
const SHIFT_MS = 12 * 60 * 60 * 1000;

export async function sendShiftSummary() {
  const now = Date.now();
  const from = now - SHIFT_MS;

  const blue = stats.blue.filter(e => e.ts >= from);
  const green = stats.green.filter(e => e.ts >= from);

  // якщо порушень не було
  if (blue.length === 0 && green.length === 0) {
    await send("✅ За минулу зміну всі рівні було виставлено без затримок");
    return;
  }

  let text = "📊 Підсумок за останні 12 годин:\n\n";

  const countByLoc = (arr) =>
    arr.reduce((acc, e) => {
      acc[e.locKey] = (acc[e.locKey] || 0) + 1;
      return acc;
    }, {});

  const blueByLoc = countByLoc(blue);
  const greenByLoc = countByLoc(green);

  for (const [loc, count] of Object.entries(blueByLoc)) {
    text += `🔷 ${loc}: ${count} затримок синього\n`;
  }

  for (const [loc, count] of Object.entries(greenByLoc)) {
    text += `✅ ${loc}: ${count} затримок зеленого\n`;
  }

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