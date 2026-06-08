import { useEffect, useMemo, useState } from "react";
import DishCard from "../components/DishCard";
import { defaultDishes } from "../data/defaultDishes";
import { hasFirebaseConfig } from "../firebase";
import { dishCategories, type Dish, type DishCategory } from "../types";
import { subscribeToMenuItems } from "../utils/firestoreMenu";

interface MenuPageProps {
  uid: string | null;
  onAddToCart: (dish: Dish) => void;
}

export default function MenuPage({ uid, onAddToCart }: MenuPageProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DishCategory>(dishCategories[0]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (hasFirebaseConfig && !uid) {
      setDishes(defaultDishes);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeToMenuItems(
      (nextDishes) => {
        setDishes(nextDishes.filter((dish) => dish.isAvailable));
        setLoading(false);
        setError("");
      },
      () => {
        setDishes(defaultDishes);
        setError("");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const categoryCounts = useMemo(
    () =>
      dishCategories.map((category) => ({
        category,
        count: dishes.filter((dish) => dish.category === category).length,
      })),
    [dishes]
  );

  const selectedDishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryDishes = dishes.filter((dish) => dish.category === selectedCategory);

    if (!normalizedQuery) {
      return categoryDishes;
    }

    return categoryDishes.filter((dish) =>
      [dish.name, dish.description, dish.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [dishes, query, selectedCategory]);

  const selectedCount =
    categoryCounts.find((category) => category.category === selectedCategory)?.count ?? 0;

  return (
    <section className="page-section" aria-labelledby="menu-title">
      <div className="page-heading">
        <span className="eyebrow">Menu</span>
        <h2 id="menu-title">今天吃什么</h2>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="loading-stack" aria-live="polite">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : null}

      {!loading && dishes.length === 0 ? (
        <div className="empty-state">
          <h3>还没有菜品</h3>
          <p>去 Add Dish 添加第一个菜。</p>
        </div>
      ) : null}

      {!loading && dishes.length > 0 ? (
        <div className="menu-board">
          <aside className="category-rail" aria-label="菜品分类">
            {categoryCounts.map(({ category, count }) => (
              <button
                key={category}
                type="button"
                className={selectedCategory === category ? "active" : ""}
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </aside>

          <section className="menu-content" aria-labelledby={`category-${selectedCategory}`}>
            <label className="menu-search">
              <span>搜索菜品</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索菜品..."
              />
            </label>

            <div className="category-heading selected-category-heading">
              <div>
                <h3 id={`category-${selectedCategory}`}>{selectedCategory}</h3>
                <p>{selectedCount > 0 ? `打开后显示 ${selectedCount} 道菜` : "这个分类还没有菜"}</p>
              </div>
            </div>

            {selectedDishes.length > 0 ? (
              <div className="dish-list compact-dish-list">
                {selectedDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} onAdd={onAddToCart} />
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <p>{query.trim() ? "没有搜到这个菜。" : "这个分类还没有菜。"}</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
