import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

import { locations } from "./locations.js";
import { onWhatsAppLevel } from "./logic.js";

const AUTH_DIR = "wa-auth";

// 📱 твій номер
const PHONE_NUMBER = "380676233564";

function detectLevel(text) {
  if (text.includes("🚨")) return "red";
  if (text.includes("🔷")) return "blue";
  if (text.includes("🟡")) return "yellow";
  if (text.includes("✅")) return "green";
  return null;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }),
    browser: ["DRC Alert Monitor", "Chrome", "120.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔥 ВАЖЛИВО: чекаємо підключення
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "open") {
      console.log("🔗 Connected to WhatsApp server");

      // 👉 якщо не авторизований → даємо код
      if (!sock.authState.creds.registered) {
        try {
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          console.log("🔑 PAIRING CODE:", code);
        } catch (err) {
          console.log("❌ Pairing error:", err.message);
        }
      } else {
        console.log("✅ WhatsApp connected");
      }
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ WhatsApp disconnected", code);

      if (code === DisconnectReason.loggedOut) {
        console.log("⚠️ Logged out — перезапусти щоб отримати новий код");
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages }) => {
    const msg = messages[0];

    const text =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      msg?.message?.imageMessage?.caption ||
      msg?.message?.ephemeralMessage?.message?.conversation ||
      msg?.message?.ephemeralMessage?.message?.extendedTextMessage?.text;

    if (!text) return;

    const level = detectLevel(text);
    if (!level) return;

    const loc = Object.values(locations).find(
      l => l.groupId === msg.key.remoteJid
    );

    if (!loc) return;

    console.log("📲 WhatsApp:", loc.key, "→", level);

    onWhatsAppLevel(loc.key, level);
  });
}