import { loadLevels } from "./levelStore.js";
import { locations } from "./locations.js";

export const state = {};

// читаємо збережені рівні
const saved = loadLevels();

for (const loc of Object.values(locations)) {

  const savedLevel = saved[loc.key];

  state[loc.key] = {

    // поточний рівень (відновлюємо після рестарту)
    level: savedLevel?.level || "green",

    // коли рівень був зафіксований
    levelAt: savedLevel?.levelAt || 0,

    // активний таймер
    pending: null,

    // очікуємо зелений після Telegram-відбою
    awaitingGreen: false,

    // час останніх Telegram подій
    lastTelegramAlertAt: 0,
    lastTelegramClearAt: 0,

    // 📊 журнал затримок за зміну
    shiftStats: {
      blue: [],   // [{ reminderAt, resolvedAt, closed }]
      green: []   // [{ reminderAt, resolvedAt, closed }]
    }

  };

}