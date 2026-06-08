import type { Timestamp } from "firebase/firestore";

export const dishCategories = [
  "荤菜",
  "素菜",
  "糖醋",
  "红烧",
  "主食",
  "饮料",
] as const;

export type DishCategory = (typeof dishCategories)[number];

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  description: string;
  image: string;
  isAvailable: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
}

export interface CartItem {
  dishId: string;
  name: string;
  quantity: number;
  image: string;
  category: DishCategory;
}

export const orderStatuses = ["new", "accepted", "preparing", "done"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export interface Order {
  id: string;
  createdAt: Timestamp | null;
  createdBy: string;
  items: CartItem[];
  note: string;
  status: OrderStatus;
  updatedAt: Timestamp | null;
}

export type Page = "menu" | "cart" | "add-dish";
