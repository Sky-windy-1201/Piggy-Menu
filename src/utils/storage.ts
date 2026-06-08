const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 750_000;
const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"] as const;

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

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.addEventListener("load", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    });

    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not prepare this photo. Try a JPG or PNG from your gallery."));
    });

    image.src = objectUrl;
  });

const drawImageToDataUrl = (
  image: HTMLImageElement,
  maxDimension: number,
  quality: number
): string => {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare this photo.");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
};

export const fileToDishImageDataUrl = async (file: File): Promise<string> => {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImageFromFile(file);
  const attempts = [
    { maxDimension: 900, quality: 0.78 },
    { maxDimension: 700, quality: 0.7 },
    { maxDimension: 520, quality: 0.64 },
    { maxDimension: 360, quality: 0.58 },
  ];

  let smallestDataUrl = "";
  for (const attempt of attempts) {
    const dataUrl = drawImageToDataUrl(image, attempt.maxDimension, attempt.quality);
    smallestDataUrl = dataUrl;

    if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
      return dataUrl;
    }
  }

  return smallestDataUrl;
};
