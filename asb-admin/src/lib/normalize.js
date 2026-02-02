// admin/src/lib/normalize.js

export function normalizeList(data, keys = []) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  for (const k of keys) {
    const v = data?.[k];
    if (Array.isArray(v)) return v;
     if (data && Array.isArray(data[k])) return data[k];
  }

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.data)) return data.data.data;

  return [];
}

export function normalizeCategory(c) {
  return {
    _id: c?._id || c?.id,
    name: c?.name || c?.title || "",
    slug: c?.slug || "",
    isActive: typeof c?.isActive === "boolean" ? c.isActive : true,
    createdAt: c?.createdAt,
    updatedAt: c?.updatedAt,
  };
}
