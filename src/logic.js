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
    if (!e.resolvedAt) e.closed = true;
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

  // ❗ якщо рівень невідомий після рестарту
  if (s.level === "unknown") {
    console.log("⚠️ Skip alert: unknown state after restart");
    return;
  }

  // 🔷 синій потрібен тільки після зеленого
  if (s.level !== "green") return;

  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  s.pending = setTimeout(() => {

    // 🔍 ПОВТОРНА ПЕРЕВІРКА перед відправкою

    if (s.level === "blue") {
      console.log("ℹ️ Skip blue reminder: already blue");
      return;
    }

    // якщо вже будь-який інший рівень (yellow/red) → теж ок
    if (s.level !== "green") {
      console.log("ℹ️ Skip blue reminder: level already updated");
      return;
    }

    sendBlueReminder(locKey, groupName);
    saveShiftStats(state);

    s.pending = null;

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
    if (!e.resolvedAt) e.closed = true;
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

  // ❗ після рестарту не довіряємо стану
  if (s.level === "unknown") {
    console.log("⚠️ Skip clear: unknown state after restart");
    return;
  }

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

    if (!s.awaitingGreen) return;

    // 🔍 ПЕРЕВІРКА перед reminder

    if (s.level === "green") {
      console.log("ℹ️ Skip green reminder: already green");
      s.awaitingGreen = false;
      return;
    }

    // якщо вже нова тривога (blue/yellow/red) → не треба зелений
    if (s.level !== "green") {
      console.log("ℹ️ Skip green reminder: new alert already active");
      s.awaitingGreen = false;
      return;
    }

    sendGreenReminder(locKey, groupName);
    saveShiftStats(state);

    s.pending = null;

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

  // 🔷 закриваємо blue подію
  if (level === "blue") {
    const last = [...s.shiftStats.blue]
      .reverse()
      .find(e => e.resolvedAt === null && !e.closed);

    if (last) {
      last.resolvedAt = Date.now();
      saveShiftStats(state);
    }
  }

  // ✅ закриваємо green подію
  if (level === "green") {
    const last = [...s.shiftStats.green]
      .reverse()
      .find(e => e.resolvedAt === null && !e.closed);

    if (last) {
      last.resolvedAt = Date.now();
      saveShiftStats(state);
    }

    s.awaitingGreen = false;
  }

  // ❗ будь-який рівень = скасовуємо таймер
  if (s.pending) {
    clearTimeout(s.pending);
    s.pending = null;
  }

  saveShiftStats(state);
}