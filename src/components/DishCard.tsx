import { useEffect, useState } from "react";
import type { Dish } from "../types";

interface DishCardProps {
  dish: Dish;
  onAdd: (dish: Dish) => void;
}

export default function DishCard({ dish, onAdd }: DishCardProps) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) {
      return undefined;
    }

    const timer = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(timer);
  }, [added]);

  const handleAdd = () => {
    onAdd(dish);
    setAdded(true);
  };

  return (
    <article className="dish-card dish-row">
      <img className="dish-image" src={dish.image} alt={dish.name} loading="lazy" />
      <div className="dish-body">
        <div className="dish-title-row">
          <div>
            <span className="category-pill">{dish.category}</span>
            <h3>{dish.name}</h3>
          </div>
        </div>
        <p>{dish.description}</p>
      </div>
      <button type="button" className="primary-button add-button dish-row-add" onClick={handleAdd}>
        {added ? "已加" : "ADD +"}
      </button>
    </article>
  );
}
