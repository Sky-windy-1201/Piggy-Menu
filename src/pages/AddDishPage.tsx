import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { defaultDishImages, defaultDishes } from "../data/defaultDishes";
import { hasFirebaseConfig } from "../firebase";
import { dishCategories, type DishCategory } from "../types";
import { addMenuItem } from "../utils/firestoreMenu";
import { fileToDataUrl, uploadDishImage, validatePngFile } from "../utils/storage";

interface AddDishPageProps {
  uid: string | null;
  authError: string;
}

interface ExampleDish {
  name: string;
  category: DishCategory;
  description: string;
  image: string;
}

const exampleDishes: ExampleDish[] = defaultDishes.map((dish) => ({
  name: dish.name,
  category: dish.category,
  description: dish.description,
  image: dish.image,
}));

const getRandomDefaultImage = (): string =>
  defaultDishImages[Math.floor(Math.random() * defaultDishImages.length)];

export default function AddDishPage({ uid, authError }: AddDishPageProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DishCategory>(dishCategories[0]);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(getRandomDefaultImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const resetForm = () => {
    setName("");
    setCategory(dishCategories[0]);
    setDescription("");
    setImage(getRandomDefaultImage());
    setImageFile(null);
    setFileInputKey((currentKey) => currentKey + 1);
    setIsAvailable(true);
  };

  const fillExample = (dish: ExampleDish) => {
    setName(dish.name);
    setCategory(dish.category);
    setDescription(dish.description);
    setImage(dish.image);
    setImageFile(null);
    setFileInputKey((currentKey) => currentKey + 1);
    setIsAvailable(true);
    setError("");
    setSuccess("");
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSuccess("");

    if (!file) {
      setImageFile(null);
      return;
    }

    const validationError = validatePngFile(file);
    if (validationError) {
      setImageFile(null);
      setFileInputKey((currentKey) => currentKey + 1);
      setError(validationError);
      return;
    }

    setError("");
    setImageFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (hasFirebaseConfig && !uid) {
      setError(authError || "Connecting to Firebase. Try again in a moment.");
      return;
    }

    if (!name.trim() || !category || !description.trim()) {
      setError("Name, category, and description are required.");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl =
        imageFile && hasFirebaseConfig && uid
          ? await uploadDishImage(imageFile, uid)
          : imageFile
            ? await fileToDataUrl(imageFile)
            : image;

      await addMenuItem(
        {
          name,
          category,
          description,
          image: imageUrl,
          isAvailable,
        },
        uid ?? undefined
      );
      resetForm();
      setSuccess("Dish added successfully ❤️");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Could not add dish.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section" aria-labelledby="add-dish-title">
      <div className="page-heading">
        <span className="eyebrow">Menu</span>
        <h2 id="add-dish-title">Add something tasty</h2>
      </div>

      <form className="dish-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as DishCategory)}
          >
            {dishCategories.map((dishCategory) => (
              <option key={dishCategory} value={dishCategory}>
                {dishCategory}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>What is it like?</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Dish photo</span>
          <input
            key={fileInputKey}
            type="file"
            accept="image/png"
            onChange={handleImageFileChange}
          />
        </label>

        {imagePreviewUrl ? (
          <div className="upload-preview">
            <img src={imagePreviewUrl} alt="Selected dish preview" />
            <div>
              <strong>{imageFile?.name}</strong>
              <span>Photo selected</span>
            </div>
          </div>
        ) : (
          <div className="upload-preview">
            <img src={image} alt="Selected default dish preview" />
            <div>
              <strong>Cute default photo</strong>
              <span>Used if you skip uploading a photo</span>
            </div>
          </div>
        )}

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
          />
          <span>Show on menu</span>
        </label>

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Saving..." : "Save dish"}
        </button>
      </form>
    </section>
  );
}
