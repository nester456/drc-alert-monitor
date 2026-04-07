import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

import { locations } from "./locations.js";
import { onWhatsAppLevel } from "./logic.js";

const AUTH_DIR = "wa-auth";
const PHONE_NUMBER = "380676233564";

function detectLevel(text) {
  if (text.includes("🚨")) return "red";
  if (text.includes("🔷")) return "blue";
  if (text.includes("🟡")) return "yellow";
  if (text.includes("✅")) return "green";
  return null;
}

export async function startWhatsApp() {
  console.log("👉 startWhatsApp CALLED");

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    console.log("👉 auth loaded");

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: "silent" }),
      browser: ["DRC Alert Monitor", "Chrome", "120.0"]
    });

    console.log("👉 socket created");

    sock.ev.on("creds.update", saveCreds);

    // 🔥 ПАРІНГ ОДРАЗУ
    if (!state.creds.registered) {
      console.log("👉 trying pairing...");

      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log("🔑 PAIRING CODE:", code);
      } catch (err) {
        console.log("❌ Pairing error:", err.message);
      }
    } else {
      console.log("✅ Already authorized");
    }

    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        console.log("✅ WhatsApp connected");
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log("❌ WhatsApp disconnected", code);
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

  } catch (err) {
    console.log("💥 WhatsApp INIT ERROR:", err.message);
  }
}