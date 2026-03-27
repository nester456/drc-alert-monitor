import fs from "fs";

const FILE = "./shiftStats.json";

export function loadShiftStats() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveShiftStats(state) {
  const data = {};

  for (const key of Object.keys(state)) {
    data[key] = state[key].shiftStats;
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}