import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { defaultDishes } from "../data/defaultDishes";
import { db, hasFirebaseConfig } from "../firebase";
import { dishCategories, type Dish, type DishCategory } from "../types";

export interface NewMenuItemInput {
  name: string;
  category: DishCategory;
  description: string;
  image: string;
  isAvailable: boolean;
}

const LOCAL_MENU_KEY = "couple-menu-local-menu";
const menuCollection = collection(db, "menuItems");

const isDishCategory = (value: unknown): value is DishCategory =>
  typeof value === "string" && (dishCategories as readonly string[]).includes(value);

const defaultCategory = dishCategories[0];

const toTimestamp = (value: unknown): Timestamp | null =>
  value instanceof Timestamp ? value : null;

const timestampMillis = (value: Timestamp | null): number => (value ? value.toMillis() : 0);

const isLocalDish = (value: unknown): value is Dish => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const dish = value as Partial<Dish>;
  return (
    typeof dish.id === "string" &&
    typeof dish.name === "string" &&
    typeof dish.description === "string" &&
    typeof dish.image === "string" &&
    typeof dish.isAvailable === "boolean" &&
    typeof dish.createdBy === "string" &&
    isDishCategory(dish.category)
  );
};

const loadLocalMenuItems = (): Dish[] => {
  try {
    const rawItems = localStorage.getItem(LOCAL_MENU_KEY);
    if (!rawItems) {
      return [];
    }

    const parsed: unknown = JSON.parse(rawItems);
    return Array.isArray(parsed)
      ? parsed.filter(isLocalDish).map((dish) => ({
          ...dish,
          createdAt: null,
          updatedAt: null,
        }))
      : [];
  } catch {
    return [];
  }
};

const saveLocalMenuItems = (items: Dish[]): void => {
  localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(items));
};

const buildLocalMenu = (): Dish[] => [...defaultDishes, ...loadLocalMenuItems()];

const toDish = (snapshot: QueryDocumentSnapshot<DocumentData>): Dish => {
  const data = snapshot.data() as Record<string, unknown>;
  const category = isDishCategory(data.category) ? data.category : defaultCategory;

  return {
    id: snapshot.id,
    name: typeof data.name === "string" ? data.name : "Untitled dish",
    category,
    description: typeof data.description === "string" ? data.description : "",
    image: typeof data.image === "string" ? data.image : "/images/tomato-egg-noodles.jpg",
    isAvailable: typeof data.isAvailable === "boolean" ? data.isAvailable : true,
    createdAt: toTimestamp(data.createdAt),
    updatedAt: toTimestamp(data.updatedAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
  };
};

export const subscribeToMenuItems = (
  callback: (dishes: Dish[]) => void,
  errorCallback: (error: FirestoreError) => void
): Unsubscribe => {
  if (!hasFirebaseConfig) {
    callback(buildLocalMenu());
    return () => undefined;
  }

  return onSnapshot(
    menuCollection,
    (snapshot) => {
      const dishes = snapshot.docs
        .map(toDish)
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
      callback([...defaultDishes, ...dishes]);
    },
    errorCallback
  );
};

export const addMenuItem = async (input: NewMenuItemInput, uid?: string): Promise<string> => {
  if (!hasFirebaseConfig) {
    const localDish: Dish = {
      id: `local-${Date.now()}`,
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim(),
      image: input.image.trim(),
      isAvailable: input.isAvailable,
      createdAt: null,
      updatedAt: null,
      createdBy: "local",
    };
    const nextItems = [...loadLocalMenuItems(), localDish];
    saveLocalMenuItems(nextItems);
    return localDish.id;
  }

  if (!uid) {
    throw new Error("Firebase is still connecting. Try again in a moment.");
  }

  const menuItem: Omit<Dish, "id" | "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    image: input.image.trim(),
    isAvailable: input.isAvailable,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
  };

  const documentReference = await addDoc(menuCollection, menuItem);

  return documentReference.id;
};
