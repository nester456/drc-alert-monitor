import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";

const apiId = 35310297;
const apiHash = "c2afb7b92faf9d448836ecc14b988579";

const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => await input.text("Номер: "),
  password: async () => await input.text("Пароль (якщо є): "),
  phoneCode: async () => await input.text("Код з Telegram: "),
});

console.log("\n✅ SESSION:");
console.log(client.session.save());

process.exit();