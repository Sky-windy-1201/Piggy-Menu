import { useEffect, useState } from "react";
import { dishCategories, type Dish, type DishCategory } from "../types";

interface DishCardProps {
  dish: Dish;
  onAdd: (dish: Dish) => void;
  onMove: (dish: Dish, category: DishCategory) => void;
  onDelete: (dish: Dish) => void;
  isManaging?: boolean;
}

export default function DishCard({
  dish,
  onAdd,
  onMove,
  onDelete,
  isManaging = false,
}: DishCardProps) {
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
      <div className="dish-manage-row" aria-label={`Manage ${dish.name}`}>
        <label>
          <span>Move to</span>
          <select
            value={dish.category}
            disabled={isManaging}
            onChange={(event) => onMove(dish, event.target.value as DishCategory)}
          >
            {dishCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="danger-button"
          disabled={isManaging}
          onClick={() => onDelete(dish)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
