import { state } from "./state.js";
import {
  sendBlueReminder,
  sendGreenReminder
} from "./telegramReminder.js";

import {
  BLUE_TIMEOUT_MS,
  GREEN_TIMEOUT_MS
} from "./config.js";

/**
 * Telegram повідомив про ПОВІТРЯНУ ТРИВОГУ
 * Очікуємо СИНІЙ рівень ПІСЛЯ цієї події
 */
export function onTelegramAlert(locKey, groupName) {
  const s = state[locKey];

  s.lastTelegramAlertAt = Date.now();

  console.log(
    "🧠 onTelegramAlert:",
    locKey,
    "level =",
    s.level,
    "levelAt =",
    s.levelAt
  );

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  // ⏱️ Завжди чекаємо підтвердження синього ПІСЛЯ Telegram
  s.pending = setTimeout(() => {
    if (
      s.level !== "blue" ||
      s.levelAt < s.lastTelegramAlertAt
    ) {
      sendBlueReminder(locKey, groupName);
    }
    s.pending = null;
  }, BLUE_TIMEOUT_MS);
}

/**
 * Telegram повідомив про ВІДБІЙ
 * Очікуємо ЗЕЛЕНИЙ рівень ПІСЛЯ цієї події
 */
export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];

  s.lastTelegramClearAt = Date.now();

  console.log(
    "🧠 onTelegramClear:",
    locKey,
    "level =",
    s.level,
    "levelAt =",
    s.levelAt
  );

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  // ⏱️ Завжди чекаємо підтвердження зеленого ПІСЛЯ Telegram
  s.pending = setTimeout(() => {
    if (
      s.level !== "green" ||
      s.levelAt < s.lastTelegramClearAt
    ) {
      sendGreenReminder(locKey, groupName);
    }
    s.pending = null;
  }, GREEN_TIMEOUT_MS);
}

/**
 * Повідомлення з WhatsApp-групи про зміну рівня
 * Фіксуємо ОСТАННІЙ рівень і час
 */
export function onWhatsAppLevel(locKey, level) {
  const s = state[locKey];

  console.log(
    "📲 onWhatsAppLevel:",
    locKey,
    "→",
    level,
    "(previous:",
    s.level,
    ")"
  );

  s.level = level;
  s.levelAt = Date.now();

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
}