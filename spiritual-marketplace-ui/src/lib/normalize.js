// client/src/lib/normalize.js

/**
 * Extract arrays safely from common API shapes.
 * Supports:
 * - array
 * - data.items
 * - data.data
 * - data.categories / data.products / data.courses
 * - nested: data.data.items etc
 */
export function normalizeList(data, keys = []) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  for (const k of keys) {
    const v = data?.[k];
    if (Array.isArray(v)) return v;
  }

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.courses)) return data.courses;

  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.data)) return data.data.data;

  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;

  for (const k of keys) {
    if (data && Array.isArray(data[k])) return data[k];
  }

  // sometimes API returns { success, ...result } where result contains items
  if (data && data.success && Array.isArray(data.items)) return data.items;
  return [];
}

export function normalizeCategory(c) {
  const _id = c?._id || c?.id || "";
  const name = typeof c?.name === "string" ? c.name : (typeof c?.title === "string" ? c.title : "");
  const slug = typeof c?.slug === "string" ? c.slug : "";
  const isActive = typeof c?.isActive === "boolean" ? c.isActive : true;

  // ✅ NEW
  const group = typeof c?.group === "string" ? c.group : "shop";
  const sortOrder =
    typeof c?.sortOrder === "number"
      ? c.sortOrder
      : Number.isFinite(Number(c?.sortOrder))
      ? Number(c.sortOrder)
      : 0;

  return { _id, name, slug, group, sortOrder, isActive };
}



export function normalizeProduct(p) {
  const _id = p?._id || p?.id || "";
  const title = p?.title || p?.name || "Product";
  const slug = p?.slug || "";
  const price = typeof p?.price === "number" ? p.price : Number(p?.price || 0);
  const mrp = p?.mrp == null ? 0 : Number(p.mrp || 0);
  const stock = p?.stock == null ? 0 : Number(p.stock || 0);
  const isActive = typeof p?.isActive === "boolean" ? p.isActive : true;

  // backend: categoryId populated object { _id, name, slug } OR plain id
  const catObj = p?.categoryId || p?.category || null;
  const category =
    catObj && typeof catObj === "object"
      ? { _id: catObj._id || catObj.id || "", name: catObj.name || "", slug: catObj.slug || "" }
      : { _id: String(catObj || ""), name: "", slug: "" };

  const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
  const description = p?.description || "";

  const ratingAvg = p?.ratingAvg ?? p?.rating ?? 0;
  const ratingCount = p?.ratingCount ?? 0;

  return {
    _id,
    title,
    slug,
    price,
    mrp,
    stock,
    isActive,
    category,
    images,
    description,
    ratingAvg,
    ratingCount,
    raw: p,
  };
}
export function normalizeCourse(c) {
  return {
    _id: c?._id || c?.id || "",
    title: c?.title || c?.name || "",
    slug: c?.slug || "",
    description: c?.description || "",
    thumbnail: c?.thumbnail || "",
    price: typeof c?.price === "number" ? c.price : Number(c?.price || 0),
    mrp: c?.mrp === null || c?.mrp === undefined ? 0 : Number(c.mrp || 0),
    isActive: typeof c?.isActive === "boolean" ? c.isActive : true,
    ratingAvg: typeof c?.ratingAvg === "number" ? c.ratingAvg : Number(c?.ratingAvg || 0),
    ratingCount: typeof c?.ratingCount === "number" ? c.ratingCount : Number(c?.ratingCount || 0),
    lessons: Array.isArray(c?.lessons) ? c.lessons : [],
    createdAt: c?.createdAt || "",
    raw: c
  };
}

export function normalizeLesson(l, idx = 0) {
  return {
    id: l?._id || l?.id || `l${idx + 1}`,
    title: l?.title || (typeof l === "string" ? l : `Lesson ${idx + 1}`),
    videoUrl: l?.videoUrl || l?.video || "",
    durationSec: typeof l?.durationSec === "number" ? l.durationSec : Number(l?.durationSec || 0),
    isFreePreview: !!l?.isFreePreview,
    notes: l?.notes || ""
  };
}

export function formatDuration(durationSec) {
  const s = Number(durationSec || 0);
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}

export function isYouTubeUrl(url) {
  const u = String(url || "");
  return u.includes("youtube.com") || u.includes("youtu.be");
}

export function toYouTubeEmbedUrl(url) {
  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    // youtube.com/watch?v=<id>
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    return "";
  } catch {
    return "";
  }
}