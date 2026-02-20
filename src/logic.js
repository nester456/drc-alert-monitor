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
 * TELEGRAM: ПОВІТРЯНА ТРИВОГА
 * 🔷 Синій потрібен ТІЛЬКИ якщо ДО ЦЬОГО був зелений
 */
export function onTelegramAlert(locKey, groupName) {
  const s = state[locKey];
  const alertAt = Date.now();

  s.lastTelegramAlertAt = alertAt;

  console.log(
    "🧠 onTelegramAlert:",
    locKey,
    "level =", s.level,
    "levelAt =", s.levelAt
  );

  // 🔒 Якщо не було зеленого — синій не потрібен
  if (s.level !== "green") {
    console.log("ℹ️ Blue not required, current level =", s.level);
    return;
  }

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  s.pending = setTimeout(() => {
    if (
      s.level !== "blue" ||
      s.levelAt < alertAt
    ) {
      sendBlueReminder(locKey, groupName);
    }
    s.pending = null;
  }, BLUE_TIMEOUT_MS);
}

/**
 * TELEGRAM: ВІДБІЙ
 * ✅ Зелений потрібен, якщо НЕ БУЛО нового зеленого ПІСЛЯ цієї події
 */
export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];
  const clearAt = Date.now();

  s.lastTelegramClearAt = clearAt;

  console.log(
    "🧠 onTelegramClear:",
    locKey,
    "level =", s.level,
    "levelAt =", s.levelAt
  );

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  // 🔑 Визначаємо, чи потрібен новий зелений
  const greenRequired =
    // якщо рівень не зелений
    s.level !== "green" ||
    // або зелений старіший за подію (рестарт / старий стан)
    s.levelAt < clearAt;

  if (!greenRequired) {
    console.log("ℹ️ Green already confirmed after clear");
    return;
  }

  s.pending = setTimeout(() => {
    if (
      s.level !== "green" ||
      s.levelAt < clearAt
    ) {
      sendGreenReminder(locKey, groupName);
    }
    s.pending = null;
  }, GREEN_TIMEOUT_MS);
}

/**
 * WHATSAPP: ФІКСАЦІЯ РІВНЯ
 * Фіксуємо ОСТАННІЙ рівень + час
 */
export function onWhatsAppLevel(locKey, level) {
  const s = state[locKey];

  console.log(
    "📲 onWhatsAppLevel:",
    locKey,
    "→", level,
    "(previous:", s.level, ")"
  );

  s.level = level;
  s.levelAt = Date.now();

  // якщо чекали підтвердження — скасовуємо
  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
}