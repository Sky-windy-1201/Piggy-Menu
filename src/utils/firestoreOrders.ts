import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase";
import { dishCategories, orderStatuses, type CartItem, type Order, type OrderStatus } from "../types";

const LOCAL_ORDERS_KEY = "couple-menu-local-orders";
const ordersCollection = collection(db, "orders");

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (orderStatuses as readonly string[]).includes(value);

const isDishCategory = (value: unknown): value is CartItem["category"] =>
  typeof value === "string" && (dishCategories as readonly string[]).includes(value);

const defaultCategory = dishCategories[0];

const toTimestamp = (value: unknown): Timestamp | null =>
  value instanceof Timestamp ? value : null;

const timestampMillis = (value: Timestamp | null): number => (value ? value.toMillis() : 0);

const isLocalOrder = (value: unknown): value is Order => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const order = value as Partial<Order>;
  return (
    typeof order.id === "string" &&
    typeof order.createdBy === "string" &&
    typeof order.note === "string" &&
    isOrderStatus(order.status) &&
    Array.isArray(order.items)
  );
};

const toCartItem = (value: unknown): CartItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  if (
    typeof item.dishId !== "string" ||
    typeof item.name !== "string" ||
    typeof item.quantity !== "number" ||
    typeof item.image !== "string" ||
    typeof item.category !== "string"
  ) {
    return null;
  }

  return {
    dishId: item.dishId,
    name: item.name,
    quantity: item.quantity,
    image: item.image,
    category: isDishCategory(item.category) ? item.category : defaultCategory,
  };
};

const toOrder = (snapshot: QueryDocumentSnapshot<DocumentData>): Order => {
  const data = snapshot.data() as Record<string, unknown>;
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(toCartItem).filter((item): item is CartItem => Boolean(item));

  return {
    id: snapshot.id,
    createdAt: toTimestamp(data.createdAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    items,
    note: typeof data.note === "string" ? data.note : "",
    status: isOrderStatus(data.status) ? data.status : "new",
    updatedAt: toTimestamp(data.updatedAt),
  };
};

export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  errorCallback: (error: FirestoreError) => void
): Unsubscribe => {
  if (!hasFirebaseConfig) {
    try {
      const rawOrders = localStorage.getItem(LOCAL_ORDERS_KEY);
      const parsed: unknown = rawOrders ? JSON.parse(rawOrders) : [];
      callback(Array.isArray(parsed) ? parsed.filter(isLocalOrder) : []);
    } catch {
      callback([]);
    }

    return () => undefined;
  }

  return onSnapshot(
    ordersCollection,
    (snapshot) => {
      const orders = snapshot.docs
        .map(toOrder)
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
      callback(orders);
    },
    errorCallback
  );
};

export const createOrder = async (
  items: CartItem[],
  note: string,
  uid?: string
): Promise<string> => {
  const orderItems = items.map((item) => ({
    dishId: item.dishId,
    name: item.name,
    quantity: item.quantity,
    image: item.image,
    category: item.category,
  }));

  if (!hasFirebaseConfig) {
    const localOrder: Order = {
      id: `local-order-${Date.now()}`,
      createdAt: null,
      createdBy: "local",
      items: orderItems,
      note: note.trim(),
      status: "new",
      updatedAt: null,
    };

    try {
      const rawOrders = localStorage.getItem(LOCAL_ORDERS_KEY);
      const parsed: unknown = rawOrders ? JSON.parse(rawOrders) : [];
      const currentOrders = Array.isArray(parsed) ? parsed.filter(isLocalOrder) : [];
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([localOrder, ...currentOrders]));
    } catch {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([localOrder]));
    }

    return localOrder.id;
  }

  if (!uid) {
    throw new Error("Firebase is still connecting. Try again in a moment.");
  }

  const documentReference = await addDoc(ordersCollection, {
    createdAt: serverTimestamp(),
    createdBy: uid,
    items: orderItems,
    note: note.trim(),
    status: "new",
    updatedAt: serverTimestamp(),
  });

  return documentReference.id;
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  if (!hasFirebaseConfig) {
    try {
      const rawOrders = localStorage.getItem(LOCAL_ORDERS_KEY);
      const parsed: unknown = rawOrders ? JSON.parse(rawOrders) : [];
      const currentOrders = Array.isArray(parsed) ? parsed.filter(isLocalOrder) : [];
      localStorage.setItem(
        LOCAL_ORDERS_KEY,
        JSON.stringify(
          currentOrders.map((order) => (order.id === orderId ? { ...order, status } : order))
        )
      );
    } catch {
      return;
    }
    return;
  }

  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
};
