import type { CartItem } from "../types";
import { buildOrderText } from "./share";

const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN?.trim() ?? "";
const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID?.trim() ?? "";

export const hasClientTelegramConfig = (): boolean =>
  Boolean(telegramBotToken && telegramChatId);

export const sendTelegramOrder = async (
  items: CartItem[],
  note: string,
  orderTime: Date
): Promise<void> => {
  if (!hasClientTelegramConfig()) {
    throw new Error("Telegram bot token or chat ID is missing.");
  }

  const url = new URL(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`);
  url.search = new URLSearchParams({
    chat_id: telegramChatId,
    text: buildOrderText(items, note, orderTime),
    disable_web_page_preview: "true",
  }).toString();

  await fetch(url.toString(), {
    method: "GET",
    mode: "no-cors",
    keepalive: true,
  });
};
