import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"] as const;

const cleanFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "dish";

const getImageExtension = (file: File): string => {
  const extensionFromName = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (
    extensionFromName &&
    imageExtensions.includes(extensionFromName as (typeof imageExtensions)[number])
  ) {
    return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
  }

  const extensionFromType = file.type.toLowerCase().replace("image/", "").split("+")[0];
  return (
    (extensionFromType === "jpeg" ? "jpg" : extensionFromType).replace(/[^a-z0-9]/g, "") || "jpg"
  );
};

export const validateImageFile = (file: File): string | null => {
  const extension = getImageExtension(file);
  const isImage =
    file.type.startsWith("image/") ||
    imageExtensions.includes(extension as (typeof imageExtensions)[number]);

  if (!isImage) {
    return "Please choose a photo from your gallery.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Please keep dish photos under 5 MB.";
  }

  return null;
};

export const uploadDishImage = async (file: File, uid: string): Promise<string> => {
  if (!storage) {
    throw new Error("Image upload needs Firebase Storage setup.");
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const contentType = file.type || `image/${getImageExtension(file)}`;
  const extension = getImageExtension(file);
  const filePath = `dish-images/${uid}/${Date.now()}-${cleanFileName(file.name)}.${extension}`;
  const imageReference = ref(storage, filePath);
  const snapshot = await uploadBytes(imageReference, file, {
    contentType,
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
