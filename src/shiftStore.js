import fs from "fs";

const FILE = "/app/wa-auth/shiftStats.json";

/**
 * 📥 Завантаження статистики
 */
export function loadShiftStats() {
  try {
    if (!fs.existsSync(FILE)) {
      console.log("⚠️ shiftStats.json not found");
      return {};
    }

    const data = fs.readFileSync(FILE, "utf8");

    if (!data) {
      console.log("⚠️ shiftStats.json is empty");
      return {};
    }

    const parsed = JSON.parse(data);

    console.log("📂 shiftStats loaded successfully");

    return parsed;
  } catch (err) {
    console.log("⚠️ Failed to load shiftStats:", err.message);
    return {};
  }
}

/**
 * 💾 Збереження статистики
 */
export function saveShiftStats(state) {
  try {
    const data = {};

    for (const key of Object.keys(state)) {
      data[key] = {
        blue: state[key].shiftStats.blue || [],
        green: state[key].shiftStats.green || []
      };
    }

    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

    console.log("💾 shiftStats saved");
  } catch (err) {
    console.log("⚠️ Failed to save shiftStats:", err.message);
  }
}