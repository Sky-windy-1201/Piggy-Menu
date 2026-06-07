import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const cleanFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/\.png$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "dish";

export const validatePngFile = (file: File): string | null => {
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");

  if (!isPng) {
    return "Please upload a PNG image.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Please keep dish images under 5 MB.";
  }

  return null;
};

export const uploadDishImage = async (file: File, uid: string): Promise<string> => {
  if (!storage) {
    throw new Error("Image upload needs Firebase Storage setup.");
  }

  const validationError = validatePngFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const filePath = `dish-images/${uid}/${Date.now()}-${cleanFileName(file.name)}.png`;
  const imageReference = ref(storage, filePath);
  const snapshot = await uploadBytes(imageReference, file, {
    contentType: "image/png",
    customMetadata: {
      uploadedBy: uid,
    },
  });

  return getDownloadURL(snapshot.ref);
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read selected image."));
    });

    reader.addEventListener("error", () => {
      reject(new Error("Could not read selected image."));
    });

    reader.readAsDataURL(file);
  });
