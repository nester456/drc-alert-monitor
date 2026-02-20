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
 * Очікуємо СИНІЙ рівень, якщо поточний був ЗЕЛЕНИЙ
 */
export function onTelegramAlert(locKey, groupName) {
  const s = state[locKey];

  console.log(
    "🧠 onTelegramAlert:",
    locKey,
    "current level =",
    s.level
  );

  // Синій має сенс ТІЛЬКИ після зеленого
  if (s.level !== "green") return;

  // Скасовуємо попереднє очікування, якщо було
  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  s.pending = setTimeout(() => {
    if (s.level === "green") {
      sendBlueReminder(locKey, groupName);
    }
    s.pending = null;
  }, BLUE_TIMEOUT_MS);
}

/**
 * Telegram повідомив про ВІДБІЙ
 * Очікуємо ЗЕЛЕНИЙ рівень, якщо поточний ≠ зелений
 */
export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];

  console.log(
    "🧠 onTelegramClear:",
    locKey,
    "current level =",
    s.level
  );

  // Зелений після зеленого не потрібен
  if (s.level === "green") return;

  // Скасовуємо попереднє очікування, якщо було
  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  s.pending = setTimeout(() => {
    if (s.level !== "green") {
      sendGreenReminder(locKey, groupName);
    }
    s.pending = null;
  }, GREEN_TIMEOUT_MS);
}

/**
 * Повідомлення з WhatsApp-групи про зміну рівня
 * Зберігаємо ТІЛЬКИ ОСТАННІЙ рівень
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

  // Ігноруємо повтори
  if (level === "green" && s.level === "green") return;
  if (level === "blue" && s.level !== "green") return;

  s.level = level;
  s.levelAt = Date.now();

  // Якщо чекали таймер — зупиняємо
  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
}