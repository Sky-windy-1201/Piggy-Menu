import { useCallback, useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import PasswordGate from "./components/PasswordGate";
import AddDishPage from "./pages/AddDishPage";
import CartPage from "./pages/CartPage";
import MenuPage from "./pages/MenuPage";
import { hasFirebaseConfig } from "./firebase";
import type { CartItem, Dish, Page } from "./types";
import { addToCart, loadCart } from "./utils/cart";
import { subscribeToAnonymousAuth } from "./utils/auth";

const UNLOCK_KEY = "couple-menu-unlocked";

const initialUnlocked = (): boolean => localStorage.getItem(UNLOCK_KEY) === "true";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [page, setPage] = useState<Page>("menu");
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [uid, setUid] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isUnlocked || !hasFirebaseConfig) {
      setUid(null);
      setAuthError("");
      return undefined;
    }

    const unsubscribe = subscribeToAnonymousAuth(
      (nextUid) => {
        setUid(nextUid);
        setAuthError("");
      },
      (message) => {
        setUid(null);
        setAuthError(message);
      }
    );

    return unsubscribe;
  }, [isUnlocked]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const handleLock = () => {
    localStorage.removeItem(UNLOCK_KEY);
    setIsUnlocked(false);
    setUid(null);
  };

  const handleAddToCart = (dish: Dish) => {
    setCart(addToCart(dish, cart));
  };

  const renderPage = () => {
    switch (page) {
      case "menu":
        return <MenuPage uid={uid} onAddToCart={handleAddToCart} />;
      case "cart":
        return <CartPage items={cart} uid={uid} authError={authError} onCartChange={setCart} />;
      case "add-dish":
        return <AddDishPage uid={uid} authError={authError} />;
      default:
        return <MenuPage uid={uid} onAddToCart={handleAddToCart} />;
    }
  };

  if (!isUnlocked) {
    return <PasswordGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">Couple Menu</span>
          <h1>Yuhong's menu</h1>
        </div>
        <button type="button" className="ghost-button compact" onClick={handleLock}>
          Lock
        </button>
      </header>

      <main>{renderPage()}</main>

      <BottomNav currentPage={page} cartCount={cartCount} onChange={setPage} />
    </div>
  );
}
