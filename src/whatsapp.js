import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";
import fs from "fs";

import { locations } from "./locations.js";
import { onWhatsAppLevel } from "./logic.js";

const AUTH_DIR = "wa-auth";

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectLevel(text) {
  // ❗ Працюємо ТІЛЬКИ по емодзі
  if (text.includes("🚨")) return "red";
  if (text.includes("🔷")) return "blue";
  if (text.includes("🟡")) return "yellow";
  if (text.includes("✅")) return "green";

  return null;
}

export async function startWhatsApp() {
  if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length === 0) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }),
    browser: ["DRC Alert Monitor", "Chrome", "120.0"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ WhatsApp connected");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ WhatsApp disconnected", code);

      if (code !== DisconnectReason.loggedOut) {
        setTimeout(startWhatsApp, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages }) => {
    const msg = messages[0];
    const text = msg?.message?.conversation;
    if (!text) return;

    const level = detectLevel(text);

if (!level) {
  console.log(
    "ℹ️ WhatsApp message ignored (no emoji level):",
    text.slice(0, 80)
  );
  return;
}

    const loc = Object.values(locations).find(
      l => l.groupId === msg.key.remoteJid
    );
    if (!loc) return;

    console.log(
      "📲 WhatsApp level detected:",
      loc.key,
      "→",
      level
    );

    onWhatsAppLevel(loc.key, level);
  });
}