import { launchImageLibrary } from "react-native-image-picker";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export async function pickStudentIdPhoto(): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: "photo",
    includeBase64: true,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
  });

  if (result.didCancel) {
    return null;
  }
  if (result.errorCode) {
    throw new Error(result.errorMessage || "Could not open the photo library");
  }

  const asset = result.assets?.[0];
  if (!asset?.base64) {
    throw new Error("The selected photo could not be read");
  }
  if (asset.fileSize != null && asset.fileSize > MAX_PHOTO_BYTES) {
    throw new Error("ID card photo must be smaller than 2 MB");
  }

  return `data:${asset.type || "image/jpeg"};base64,${asset.base64}`;
}
