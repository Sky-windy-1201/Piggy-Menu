import type { Page } from "../types";

interface BottomNavProps {
  currentPage: Page;
  cartCount: number;
  onChange: (page: Page) => void;
}

const navItems: Array<{ page: Page; label: string }> = [
  { page: "menu", label: "Menu" },
  { page: "cart", label: "Cart" },
  { page: "add-dish", label: "Add" },
];

export default function BottomNav({ currentPage, cartCount, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {navItems.map((item) => (
        <button
          key={item.page}
          type="button"
          className={[
            "nav-button",
            currentPage === item.page ? "active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(item.page)}
        >
          <span>{item.label}</span>
          {item.page === "cart" && cartCount > 0 ? (
            <span className="nav-badge" aria-label={`${cartCount} cart items`}>
              {cartCount}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
