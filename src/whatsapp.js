import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import { setQR, startQRServer } from "./qrServer.js";

import pino from "pino";
import fs from "fs";
import axios from "axios";
import QRCode from "qrcode";
import FormData from "form-data";

import { locations } from "./locations.js";
import { onWhatsAppLevel } from "./logic.js";

const AUTH_DIR = "wa-auth";

// 🔐 Telegram для QR
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = "-1003719282039";

function detectLevel(text) {
  if (text.includes("🚨")) return "red";
  if (text.includes("🔷")) return "blue";
  if (text.includes("🟡")) return "yellow";
  if (text.includes("✅")) return "green";
  return null;
}

export async function startWhatsApp() {
  // 🧹 чистимо пусту auth папку
export async function startWhatsApp() {

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

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

  // 🌐 запускаємо QR сервер
  startQRServer();

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

    if (qr) {
      console.log("📲 QR GENERATED");

      // 👉 показ у браузері
      setQR(qr);

      // 👉 Telegram (опціонально)
      try {
        const qrImage = await QRCode.toBuffer(qr);

        const formData = new FormData();
        formData.append("chat_id", CHANNEL);
        formData.append("photo", qrImage, {
          filename: "qr.png",
          contentType: "image/png"
        });
        formData.append("caption", "📲 Скануй QR для WhatsApp");

        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
          formData,
          { headers: formData.getHeaders() }
        );

      } catch (err) {
        console.log("❌ QR Telegram error:", err.message);
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected");
    }

if (connection === "close") {
  const code = lastDisconnect?.error?.output?.statusCode;

  console.log("❌ WhatsApp disconnected", code);

  if (code === DisconnectReason.loggedOut) {
    console.log("⚠️ Logged out — потрібен новий QR");
  } else {
    console.log("⏳ Чекаємо, не перезапускаємо щоб не зламати QR");
  }
}
  });

  // 📩 повідомлення
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

    if (!level) {
      console.log("ℹ️ ignored:", text.slice(0, 60));
      return;
    }

    const loc = Object.values(locations).find(
      l => l.groupId === msg.key.remoteJid
    );

    if (!loc) return;

    console.log("📲 WhatsApp:", loc.key, "→", level);

    onWhatsAppLevel(loc.key, level);
  });
}