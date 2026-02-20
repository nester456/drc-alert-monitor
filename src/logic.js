import { state } from "./state.js";
import {
  sendBlueReminder,
  sendGreenReminder
} from "./telegramReminder.js";

import {
  BLUE_TIMEOUT_MS,
  GREEN_TIMEOUT_MS
} from "./config.js";

export function onTelegramAlert(locKey, groupName) {
  const s = state[locKey];

  // синій має сенс ТІЛЬКИ після зеленого
  if (s.level !== "green") return;

  s.pending = setTimeout(() => {
    if (s.level === "green") {
      sendBlueReminder(locKey, groupName);
    }
    s.pending = null;
  }, BLUE_TIMEOUT_MS);
}

export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];

  // зелений після зеленого не потрібен
  if (s.level === "green") return;

  s.pending = setTimeout(() => {
    if (s.level !== "green") {
      sendGreenReminder(locKey, groupName);
    }
    s.pending = null;
  }, GREEN_TIMEOUT_MS);
}
console.log(
  "🧠 onTelegramClear:",
  locKey,
  "current level =",
  s.level
);

export function onWhatsAppLevel(locKey, level) {
  const s = state[locKey];

  // ігноруємо повтори
  if (level === "green" && s.level === "green") return;
  if (level === "blue" && s.level !== "green") return;

  s.level = level;
  s.levelAt = Date.now();

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
}