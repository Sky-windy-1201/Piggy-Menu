import type { CartItem } from "../types";

const formatOrderTime = (date: Date): string =>
  date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const buildOrderText = (
  items: CartItem[],
  note: string,
  orderTime: Date
): string => {
  const lines = items.map((item) => `- ${item.name} x${item.quantity}`);
  const noteLine = note.trim() ? `Note: ${note.trim()}` : "Note: No note";

  return [
    "Couple Menu order",
    "",
    ...lines,
    "",
    noteLine,
    `Order time: ${formatOrderTime(orderTime)}`,
  ].join("\n");
};

export const buildWhatsAppOrderText = buildOrderText;

export const buildWhatsAppShareUrl = (
  items: CartItem[],
  note: string,
  orderTime: Date
): string => {
  const message = buildOrderText(items, note, orderTime);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const buildTelegramShareUrl = (
  items: CartItem[],
  note: string,
  orderTime: Date
): string => {
  const message = buildOrderText(items, note, orderTime);
  return `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`;
};
