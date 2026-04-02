import { loadLevels } from "./levelStore.js";
import { locations } from "./locations.js";
import { loadShiftStats } from "./shiftStore.js";

const savedStats = loadShiftStats();
const saved = loadLevels();

export const state = {};

for (const loc of Object.values(locations)) {
  const savedLevel = saved[loc.key];

  state[loc.key] = {
    // поточний рівень
    level: savedLevel?.level || "green",

    // коли встановлений рівень
    levelAt: savedLevel?.levelAt || 0,

    // активний таймер
    pending: null,

    // очікування зеленого після Telegram
    awaitingGreen: false,

    // останні Telegram події
    lastTelegramAlertAt: 0,
    lastTelegramClearAt: 0,

    // статистика зміни
    shiftStats: savedStats[loc.key] || {
      blue: [],
      green: []
    }
  };
}
