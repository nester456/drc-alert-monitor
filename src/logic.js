import { saveLevel } from "./levelStore.js";
import { state } from "./state.js";
import {
  sendBlueReminder,
  sendGreenReminder
} from "./telegramReminder.js";

import {
  BLUE_TIMEOUT_MS,
  GREEN_TIMEOUT_MS
} from "./config.js";
import { saveShiftStats } from "./shiftStore.js";
// ⏱️ Довіра до зеленого навколо Telegram-відбою (мс)
const GREEN_GRACE_MS = 90 * 1000;

/**
 * TELEGRAM: ПОВІТРЯНА ТРИВОГА
 * 🔷 Синій потрібен ТІЛЬКИ якщо ДО ЦЬОГО був зелений
 */
export function onTelegramAlert(locKey, groupName) {
  const s = state[locKey];

  // закриваємо старі незакриті blue події
  for (const e of s.shiftStats.blue) {
    if (!e.resolvedAt) {
      e.closed = true;
    }
  }

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

  if (s.level === "blue") {
    console.log("ℹ️ Skip blue reminder: already exists");
    return;
  }

  if (s.level !== "green") {
    console.log("ℹ️ Skip blue reminder: state changed");
    return;
  }

  sendBlueReminder(locKey, groupName);
  saveShiftStats(state);

}, BLUE_TIMEOUT_MS);
}

/**
 * TELEGRAM: ВІДБІЙ
 * ✅ Зелений потрібен, якщо НЕ БУЛО валідного зеленого
 */
export function onTelegramClear(locKey, groupName) {
  const s = state[locKey];

  // закриваємо старі незакриті green події
  for (const e of s.shiftStats.green) {
    if (!e.resolvedAt) {
      e.closed = true;
    }
  }

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

  if (!s.awaitingGreen) return;

  if (s.level === "green") {
    console.log("ℹ️ Skip green reminder: already exists");
    s.awaitingGreen = false;
    return;
  }

  if (s.level !== "green") {
    console.log("ℹ️ Skip green reminder: new alert state");
    s.awaitingGreen = false;
    return;
  }

  sendGreenReminder(locKey, groupName);
  saveShiftStats(state);

}, GREEN_TIMEOUT_MS);
}

/**
 * WHATSAPP: ЗМІНА РІВНЯ
 * 📊 закриваємо ОСТАННЮ незакриту подію
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
  saveLevel(locKey, s.level, s.levelAt);

  if (level === "blue") {
    const last = [...s.shiftStats.blue]
      .reverse()
      .find(e => e.resolvedAt === null && !e.closed);

    if (last) last.resolvedAt = Date.now();
  }

  if (level === "green") {
    const last = [...s.shiftStats.green]
      .reverse()
      .find(e => e.resolvedAt === null && !e.closed);

    if (last) last.resolvedAt = Date.now();

    s.awaitingGreen = false;
  }

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }
  saveShiftStats(state);
}

