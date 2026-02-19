import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";
import QRCode from "qrcode";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

import { locations } from "./locations.js";
import { onWhatsAppLevel } from "./logic.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const REMINDER_CHANNEL = "-1003719282039";
const AUTH_DIR = "wa-auth";

async function sendQrToTelegram(qr) {
  const buffer = await QRCode.toBuffer(qr);

  const form = new FormData();
  form.append("chat_id", REMINDER_CHANNEL);
  form.append(
    "caption",
    "🔐 QR-код для підключення WhatsApp\nВідскануйте з *основного телефону*",
  );
  form.append("photo", buffer, "wa-qr.png");

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    form,
    {
      headers: form.getHeaders(),
      params: { parse_mode: "Markdown" }
    }
  );
}

export async function startWhatsApp() {
  // 🔥 ЖОРСТКИЙ ФІКС: якщо папка auth порожня або зламана — видаляємо
  if (fs.existsSync(AUTH_DIR)) {
    const files = fs.readdirSync(AUTH_DIR);
    if (files.length === 0) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["DRC Alert Monitor", "Chrome", "120.0"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log("📲 QR GENERATED — sending to Telegram");
      await sendQrToTelegram(qr);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ WhatsApp disconnected", code);

      if (code !== DisconnectReason.loggedOut) {
        console.log("🔁 Restarting WhatsApp socket");
        setTimeout(startWhatsApp, 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages }) => {
    const msg = messages[0];
    const text = msg?.message?.conversation?.toLowerCase();
    if (!text) return;

    const loc = Object.values(locations).find(
      l => l.groupId === msg.key.remoteJid
    );
    if (!loc) return;

    if (text.includes("рівень синій")) {
      onWhatsAppLevel(loc.key, "blue");
    }

    if (text.includes("рівень зелений")) {
      onWhatsAppLevel(loc.key, "green");
    }
  });
}