import express from "express";
import QRCode from "qrcode";

let currentQR = null;

export function setQR(qr) {
  currentQR = qr;
}

export function startQRServer() {
  const app = express();

  app.get("/", async (req, res) => {
    if (!currentQR) {
      return res.send("⏳ Очікуємо QR код...");
    }

    const qrImage = await QRCode.toDataURL(currentQR);

    res.send(`
      <html>
        <head>
          <title>WhatsApp QR</title>
        </head>
        <body style="text-align:center; font-family:sans-serif;">
          <h2>📱 Скануй QR для WhatsApp</h2>
          <img src="${qrImage}" />
        </body>
      </html>
    `);
  });

  app.listen(3000, () => {
    console.log("🌐 QR Server: http://localhost:3000");
  });
}