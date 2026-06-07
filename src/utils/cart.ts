import { dishCategories, type CartItem, type Dish, type DishCategory } from "../types";

const CART_KEY = "couple-menu-cart";
const defaultCategory = dishCategories[0];

const isDishCategory = (value: unknown): value is DishCategory =>
  typeof value === "string" && (dishCategories as readonly string[]).includes(value);

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;
  return (
    typeof item.dishId === "string" &&
    typeof item.name === "string" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.image === "string" &&
    typeof item.category === "string"
  );
};

const normalizeCartItem = (item: CartItem): CartItem => ({
  ...item,
  category: isDishCategory(item.category) ? item.category : defaultCategory,
});

export const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem).map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (dish: Dish, currentCart: CartItem[] = loadCart()): CartItem[] => {
  const existing = currentCart.find((item) => item.dishId === dish.id);

  const nextCart = existing
    ? currentCart.map((item) =>
        item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
      )
    : [
        ...currentCart,
        {
          dishId: dish.id,
          name: dish.name,
          quantity: 1,
          image: dish.image,
          category: dish.category,
        },
      ];

  saveCart(nextCart);
  return nextCart;
};

export const increaseQuantity = (
  dishId: string,
  currentCart: CartItem[] = loadCart()
): CartItem[] => {
  const nextCart = currentCart.map((item) =>
    item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
  );
  saveCart(nextCart);
  return nextCart;
};

export const decreaseQuantity = (
  dishId: string,
  currentCart: CartItem[] = loadCart()
): CartItem[] => {
  const nextCart = currentCart
    .map((item) => (item.dishId === dishId ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
  saveCart(nextCart);
  return nextCart;
};

export const removeFromCart = (
  dishId: string,
  currentCart: CartItem[] = loadCart()
): CartItem[] => {
  const nextCart = currentCart.filter((item) => item.dishId !== dishId);
  saveCart(nextCart);
  return nextCart;
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};
