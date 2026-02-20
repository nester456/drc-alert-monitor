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
 * 🔷 Синій ВИМАГАЄМО ТІЛЬКИ якщо ДО ЦЬОГО був зелений
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

  // 🔒 Якщо не було зеленого — синій НЕ потрібен
  if (s.level !== "green") {
    console.log(
      "ℹ️ Blue not required, current level is",
      s.level
    );
    return;
  }

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

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
 * ✅ ЗАВЖДИ очікуємо НОВИЙ зелений ПІСЛЯ цієї події
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