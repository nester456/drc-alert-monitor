import { locations } from "./locations.js";

export const state = {};

for (const loc of Object.values(locations)) {
  state[loc.key] = {
    level: "green",
    levelAt: 0,
    pending: null,
    awaitingGreen: false,
    lastTelegramAlertAt: 0,
    lastTelegramClearAt: 0,

    // 📊 журнал затримок за зміну
    shiftStats: {
      blue: [],   // [{ reminderAt, resolvedAt }]
      green: []   // [{ reminderAt, resolvedAt }]
    }
  };
}