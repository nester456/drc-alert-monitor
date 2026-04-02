import fs from "fs";

const FILE = "./levels.json";

export function loadLevels() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveLevel(locKey, level, levelAt) {
  const data = loadLevels();

  data[locKey] = { level, levelAt };

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}