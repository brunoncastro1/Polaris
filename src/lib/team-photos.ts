export const MAX_PHOTO_PAIRS = 8;

export function teamPhotoName(pair: number, kind: "before" | "after") {
  return pair === 1 ? `${kind}.jpg` : `${kind}-${pair}.jpg`;
}
