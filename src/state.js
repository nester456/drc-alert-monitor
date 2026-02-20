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

    // чи очікуємо зелений після Telegram-відбою
    awaitingGreen: false,

    // час останнього Telegram ALERT (тривога)
    lastTelegramAlertAt: 0,

    // час останнього Telegram CLEAR (відбій)
    lastTelegramClearAt: 0
  };
}