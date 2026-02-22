import { state } from "./state.js";
import {
  sendBlueReminder,
  sendGreenReminder
} from "./telegramReminder.js";

import {
  BLUE_TIMEOUT_MS,
  GREEN_TIMEOUT_MS
} from "./config.js";

// ⏱️ Довіра до зеленого навколо Telegram-відбою (мс)
const GREEN_GRACE_MS = 90 * 1000;

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
    "level =",
    s.level,
    "levelAt =",
    s.levelAt
  );

  if (s.level !== "green") return;

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
 * ✅ Зелений потрібен, якщо НЕ БУЛО валідного зеленого
 */
export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];
  const clearAt = Date.now();

  s.lastTelegramClearAt = clearAt;

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

  // ✅ чи можемо зарахувати зелений
  const greenIsValid =
    s.level === "green" &&
    Math.abs(s.levelAt - clearAt) <= GREEN_GRACE_MS;

  if (greenIsValid) {
    console.log("ℹ️ Green accepted within grace window");
    s.awaitingGreen = false;
    return;
  }

  s.awaitingGreen = true;

  s.pending = setTimeout(() => {
    if (s.awaitingGreen) {
      sendGreenReminder(locKey, groupName);
    }
    s.pending = null;
  }, GREEN_TIMEOUT_MS);
}

/**
 * WHATSAPP: ЗМІНА РІВНЯ
 * ➕ Фіксуємо реакцію ПІСЛЯ reminder для підсумкового звіту
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

  // 🔷 реакція на reminder синього
  if (
    level === "blue" &&
    s.shiftStats?.blue?.reminderAt &&
    !s.shiftStats.blue.resolvedAt
  ) {
    s.shiftStats.blue.resolvedAt = Date.now();
  }

  // ✅ реакція на reminder зеленого
  if (
    level === "green" &&
    s.shiftStats?.green?.reminderAt &&
    !s.shiftStats.green.resolvedAt
  ) {
    s.shiftStats.green.resolvedAt = Date.now();
    s.awaitingGreen = false;
  }

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
}