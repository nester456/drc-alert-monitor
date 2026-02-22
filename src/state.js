import { locations } from "./locations.js";

export const state = {};

for (const loc of Object.values(locations)) {
  state[loc.key] = {
    // поточний рівень у WhatsApp
    level: "green",

    // коли цей рівень був зафіксований ботом
    levelAt: 0,

    // активний таймер очікування (blue / green)
    pending: null,

    // очікуємо зелений після Telegram-відбою
    awaitingGreen: false,

    // час останніх подій Telegram
    lastTelegramAlertAt: 0,
    lastTelegramClearAt: 0,

    // 📊 статистика за зміну (від reminder)
    shiftStats: {
      blue: {
        reminderAt: null,
        resolvedAt: null
      },
      green: {
        reminderAt: null,
        resolvedAt: null
      }
    }
  };
}