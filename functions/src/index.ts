import { initializeApp } from "firebase-admin/app";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";

initializeApp();

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

interface OrderItem {
  category: string;
  name: string;
  quantity: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toOrderItem = (value: unknown): OrderItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { category, name, quantity } = value;

  if (typeof name !== "string" || typeof quantity !== "number") {
    return null;
  }

  return {
    category: typeof category === "string" ? category : "未分类",
    name,
    quantity,
  };
};

const formatOrderItems = (items: OrderItem[]): string => {
  if (items.length === 0) {
    return "没有菜品";
  }

  return items
    .map((item) => `• ${escapeHtml(item.name)} × ${item.quantity} (${escapeHtml(item.category)})`)
    .join("\n");
};

const formatCreatedAt = (value: unknown): string => {
  if (isRecord(value) && typeof value.toDate === "function") {
    const date = value.toDate();
    if (date instanceof Date) {
      return date.toLocaleString("zh-SG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Singapore",
      });
    }
  }

  return new Date().toLocaleString("zh-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore",
  });
};

const buildTelegramMessage = (orderId: string, data: Record<string, unknown>): string => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(toOrderItem).filter((item): item is OrderItem => item !== null);
  const note = typeof data.note === "string" && data.note.trim() ? data.note.trim() : "无";
  const createdAt = formatCreatedAt(data.createdAt);

  return [
    "🍽️ <b>Couple Menu 新订单</b>",
    "",
    `<b>时间：</b>${escapeHtml(createdAt)}`,
    `<b>订单：</b>${escapeHtml(orderId)}`,
    "",
    "<b>菜品：</b>",
    formatOrderItems(items),
    "",
    `<b>备注：</b>${escapeHtml(note)}`,
  ].join("\n");
};

export const sendTelegramOrderNotification = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "asia-southeast1",
    secrets: [telegramBotToken, telegramChatId],
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      logger.warn("Order notification skipped: missing snapshot.");
      return;
    }

    const token = telegramBotToken.value();
    const chatId = telegramChatId.value();

    if (!token || !chatId) {
      logger.warn("Order notification skipped: Telegram secrets are not configured.");
      return;
    }

    const text = buildTelegramMessage(snapshot.id, snapshot.data() as Record<string, unknown>);
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        disable_web_page_preview: true,
        parse_mode: "HTML",
        text,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Telegram sendMessage failed: ${response.status} ${responseText}`);
    }

    logger.info("Telegram order notification sent.", { orderId: snapshot.id });
  }
);
