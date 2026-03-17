type Identifiable = {
  _id: string;
};

export function mergeById<T extends Identifiable>(
  existingItems: T[],
  incomingItems: T[],
): T[] {
  const existingIds = new Set(existingItems.map((item) => item._id));
  const merged = [...existingItems];

  incomingItems.forEach((item) => {
    if (!existingIds.has(item._id)) {
      merged.push(item);
    }
  });

  return merged;
}
