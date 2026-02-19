import { locations } from "./locations.js";

export const state = {};

for (const loc of Object.values(locations)) {
  state[loc.key] = {
    level: "green",          // поточний рівень
    levelAt: Date.now(),     // коли встановлений
    pending: null            // очікування (blue / green)
  };
}
