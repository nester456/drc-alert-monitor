import { sendShiftSummary } from "./shiftSummary.js";

const TARGET_TIMES = ["08:55", "20:55"]; // Kyiv time

function getKyivTime() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Europe/Kyiv"
    })
  );
}

let lastRun = null;

setInterval(() => {
  const now = getKyivTime();
  const hhmm = now.toTimeString().slice(0, 5);

  if (TARGET_TIMES.includes(hhmm)) {
    // захист від подвійного спрацювання в ту ж хвилину
    if (lastRun === hhmm) return;
    lastRun = hhmm;

    console.log(`⏰ Shift summary triggered at ${hhmm} (Kyiv)`);
    sendShiftSummary();
  }
}, 30_000);