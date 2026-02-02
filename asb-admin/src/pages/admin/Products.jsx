import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { slugify } from "../../lib/slugify";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../components/ToastProvider";
import styles from "./Products.module.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const GROUPS = [
  { value: "shop", label: "Shop" },
  { value: "gifts", label: "Gifts" },
];

function absUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return `${API_BASE}${withSlash}`;
}

function normId(x) {
  return x?._id || x?.id || "";
}

function normalizeCategory(c) {
  return {
    _id: normId(c),
    name: String(c?.name || "").trim(),
    slug: String(c?.slug || "").trim(),
    group: String(c?.group || "shop").trim().toLowerCase(),
    sortOrder: typeof c?.sortOrder === "number" ? c.sortOrder : Number(c?.sortOrder || 0),
    isActive: typeof c?.isActive === "boolean" ? c.isActive : true,
  };
}

function normalizeProduct(p) {
  const catObj = p?.categoryId && typeof p.categoryId === "object" ? p.categoryId : null;

  return {
    _id: normId(p),
    title: p?.title || p?.name || "",
    slug: p?.slug || "",

    categoryId: catObj ? normId(catObj) : (p?.categoryId || ""),
    categoryName: catObj ? (catObj?.name || "") : "",
    categoryGroup: catObj ? String(catObj?.group || "shop").toLowerCase() : "",

    price: typeof p?.price === "number" ? p.price : p?.price ? Number(p.price) : 0,
    mrp: p?.mrp === null || p?.mrp === undefined ? "" : Number(p.mrp),
    stock: p?.stock === null || p?.stock === undefined ? "" : Number(p.stock),

    images: Array.isArray(p?.images) ? p.images : [],
    description: p?.description || "",

    isActive: typeof p?.isActive === "boolean" ? p.isActive : true,

    isFeatured: !!p?.isFeatured,
    featuredOrder: typeof p?.featuredOrder === "number" ? p.featuredOrder : Number(p?.featuredOrder || 0),

    spiritualUse: p?.spiritualUse || "",
    careHandling: p?.careHandling || "",
    shippingReturns: p?.shippingReturns || "",
  };
}

function toNumberOrEmpty(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function parseLines(text) {
  return String(text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function Products() {
  const toast = useToast();

  // ✅ admin filters
  const [groupFilter, setGroupFilter] = useState("shop");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("newest");

  // data
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState("");

  // form
  const [group, setGroup] = useState("shop");
  const [categoryId, setCategoryId] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");

  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(0);

  const [imagesText, setImagesText] = useState("");
  const [description, setDescription] = useState("");

  const [spiritualUse, setSpiritualUse] = useState("");
  const [careHandling, setCareHandling] = useState("");
  const [shippingReturns, setShippingReturns] = useState("");

  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function loadCategories() {
    setCatsLoading(true);
    try {
      const data = await api.get("/api/categories");
      const arr =
        Array.isArray(data) ? data :
        Array.isArray(data?.categories) ? data.categories :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.data) ? data.data : [];

      const normalized = arr
        .map(normalizeCategory)
        .filter((x) => x._id && x.name && x.slug)
        .filter((x) => x.isActive !== false)
        .filter((x) => ["shop", "gifts"].includes(x.group))
        .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

      setCats(normalized);
    } catch {
      setCats([]);
    } finally {
      setCatsLoading(false);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setErr("");

    try {
      // ✅ backend limit max = 50
      const limit = 50;

      // ✅ fetch both groups so admin can filter locally
      const [shopRes, giftRes] = await Promise.all([
        api.get("/api/products", { query: { group: "shop", page: 1, limit, sort: "newest" } }),
        api.get("/api/products", { query: { group: "gifts", page: 1, limit, sort: "newest" } }),
      ]);

      const toArr = (data) =>
        Array.isArray(data) ? data :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.products) ? data.products :
        Array.isArray(data?.data) ? data.data : [];

      const merged = [...toArr(shopRes), ...toArr(giftRes)]
        .map(normalizeProduct)
        .filter((x) => x._id);

      setItems(merged);
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryMap = useMemo(() => {
    const m = new Map();
    cats.forEach((c) => m.set(String(c._id), c));
    return m;
  }, [cats]);

  const catsByGroup = useMemo(() => {
    return cats.filter((c) => c.group === group);
  }, [cats, group]);

  // ✅ when modal opens or group changes, keep category valid
  useEffect(() => {
    if (!modalOpen) return;
    const list = catsByGroup;
    const stillValid = list.some((c) => String(c._id) === String(categoryId));
    if (!stillValid) setCategoryId(list[0]?._id || "");
  }, [group, catsByGroup, categoryId, modalOpen]);

  const filteredClient = useMemo(() => {
    const s = search.trim().toLowerCase();
    let arr = [...items];

    if (groupFilter) {
      arr = arr.filter((p) => (p.categoryGroup || "shop") === groupFilter);
    }

    if (s) {
      arr = arr.filter((p) => {
        const t = (p.title || "").toLowerCase();
        const sl = (p.slug || "").toLowerCase();
        return t.includes(s) || sl.includes(s);
      });
    }

    if (categoryFilter) {
      arr = arr.filter((p) => String(p.categoryId || "") === String(categoryFilter));
    }

    if (sort === "priceAsc") arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "priceDesc") arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "nameAsc") arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sort === "featured") arr.sort((a, b) => (a.featuredOrder - b.featuredOrder) || (b.isFeatured - a.isFeatured));

    return arr;
  }, [items, search, categoryFilter, sort, groupFilter]);

  function resetForm() {
    setGroup("shop");
    setCategoryId("");

    setTitle("");
    setSlug("");
    setPrice("");
    setMrp("");
    setStock("");

    setIsActive(true);
    setIsFeatured(false);
    setFeaturedOrder(0);

    setImagesText("");
    setDescription("");

    setSpiritualUse("");
    setCareHandling("");
    setShippingReturns("");

    setFormErr("");
  }

  function openCreate() {
    setMode("create");
    setCurrentId("");
    resetForm();
    setModalOpen(true);
  }

  function openEdit(row) {
    setMode("edit");
    setCurrentId(row._id);

    const cat = categoryMap.get(String(row.categoryId));
    const g = String(cat?.group || row.categoryGroup || "shop").toLowerCase();

    setGroup(g);
    setCategoryId(row.categoryId || "");

    setTitle(row.title || "");
    setSlug(row.slug || "");

    setPrice(row.price === 0 ? "0" : String(row.price || ""));
    setMrp(row.mrp === "" ? "" : String(row.mrp));
    setStock(row.stock === "" ? "" : String(row.stock));

    setIsActive(!!row.isActive);

    setIsFeatured(!!row.isFeatured);
    setFeaturedOrder(Number(row.featuredOrder || 0));

    setDescription(row.description || "");
    setImagesText((row.images || []).join("\n"));

    setSpiritualUse(row.spiritualUse || "");
    setCareHandling(row.careHandling || "");
    setShippingReturns(row.shippingReturns || "");

    setFormErr("");
    setModalOpen(true);
  }

  async function onSave() {
    setFormErr("");

    const t = title.trim();
    if (!t) return setFormErr("Product title is required.");

    const finalSlug = (slug || slugify(t)).trim();
    if (!finalSlug) return setFormErr("Slug is required.");

    if (!categoryId) return setFormErr("Category is required.");

    const pr = toNumberOrEmpty(price);
    if (pr === "" || pr < 0) return setFormErr("Price must be a valid number.");

    const mrpN = toNumberOrEmpty(mrp);
    if (mrpN !== "" && mrpN < 0) return setFormErr("MRP must be a valid number.");

    const stockN = toNumberOrEmpty(stock);
    if (stockN !== "" && stockN < 0) return setFormErr("Stock must be a valid number.");

    const payload = {
      title: t,
      slug: finalSlug,
      categoryId,

      price: Number(pr),
      mrp: mrpN === "" ? 0 : Number(mrpN),
      stock: stockN === "" ? 0 : Number(stockN),

      images: parseLines(imagesText).slice(0, 4),
      description: String(description || ""),

      isActive: !!isActive,

      isFeatured: !!isFeatured,
      featuredOrder: Number(featuredOrder || 0),

      spiritualUse: String(spiritualUse || ""),
      careHandling: String(careHandling || ""),
      shippingReturns: String(shippingReturns || ""),
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/admin/products", payload);
        toast.success("Product created");
      } else {
        await api.put(`/api/admin/products/${currentId}`, payload);
        toast.success("Product updated");
      }

      setModalOpen(false);
      await loadProducts();
    } catch (e) {
      const msg = e?.response?.message || e?.message || "Save failed";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function askDelete(row) {
    setToDelete(row);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete?._id) return;

    setConfirmLoading(true);
    try {
      await api.del(`/api/admin/products/${toDelete._id}`);
      toast.success("Product deleted");
      setConfirmOpen(false);
      setToDelete(null);
      await loadProducts();
    } catch (e) {
      toast.error(e?.response?.message || e?.message || "Delete failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  const columns = [
    {
      key: "title",
      title: "Product",
      render: (r) => (
        <div className={styles.prodCell}>
          <div className={styles.prodTitle}>{r.title || "-"}</div>
          <div className={styles.prodMeta}>
            <span className={styles.muted}>slug:</span> {r.slug || "-"}
          </div>
        </div>
      ),
    },
    { key: "group", title: "Group", render: (r) => (r.categoryGroup || "shop") },
    {
      key: "category",
      title: "Category",
      render: (r) => {
        const c = categoryMap.get(String(r.categoryId));
        return c?.name || r.categoryName || "-";
      },
    },
    { key: "price", title: "Price", render: (r) => `₹${Number(r.price || 0)}` },
    {
      key: "active",
      title: "Active",
      render: (r) => (
        <span className={r.isActive ? styles.badgeOn : styles.badgeOff}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={() => openEdit(r)}>Edit</button>
          <a className={styles.btnGhost} href={`/product/${r._id}`} target="_blank" rel="noreferrer">Preview</a>
          <button className={styles.btnDanger} onClick={() => askDelete(r)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Products</h1>
          <div className={styles.sub}>2 groups only: Shop + Gifts</div>
        </div>

        <button className={styles.btnPrimary} onClick={openCreate}>+ New Product</button>
      </div>

      <div className={styles.tools}>
        <select className={styles.select} value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCategoryFilter(""); }}>
          {GROUPS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        <input
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
        />

        <select
          className={styles.select}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          disabled={catsLoading}
        >
          <option value="">All Categories</option>
          {cats.filter((c) => c.group === groupFilter).map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Sort: Newest</option>
          <option value="nameAsc">Sort: Name (A-Z)</option>
          <option value="priceAsc">Sort: Price (Low → High)</option>
          <option value="priceDesc">Sort: Price (High → Low)</option>
          <option value="featured">Sort: Featured Order</option>
        </select>

        <button className={styles.btnGhost} onClick={loadProducts}>Refresh</button>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load products</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <Table columns={columns} rows={filteredClient} keyField="_id" emptyText="No products found." />
      )}

      <Modal
        title={mode === "create" ? "Create Product" : "Edit Product"}
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <button className={styles.btnGhost} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className={styles.btnPrimary} onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Group *</label>
              <select
                className={styles.select}
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                {GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <div className={styles.muted}>Pick where this product belongs.</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category *</label>
              <select
                className={styles.select}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={catsLoading}
              >
                <option value="">{catsLoading ? "Loading…" : "Select category"}</option>
                {catsByGroup.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className={styles.muted}>Categories are filtered by group.</div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => {
                const v = e.target.value;
                setTitle(v);
                if (!slug) setSlug(slugify(v));
              }}
              placeholder="e.g. Clear Quartz Crystal"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Slug *</label>
            <input className={styles.input} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Price (₹) *</label>
              <input className={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Stock</label>
              <input className={styles.input} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>MRP (₹)</label>
              <input className={styles.input} value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" />
            </div>

            <div className={styles.fieldRow} style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 18 }}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Active</span>
              </label>

              <label className={styles.checkRow}>
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                <span>Show on Home</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Home Order</label>
            <input
              className={styles.input}
              type="number"
              value={Number(featuredOrder || 0)}
              onChange={(e) => setFeaturedOrder(Number(e.target.value || 0))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Images</label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []).slice(0, 4);
                if (!files.length) return;

                const fd = new FormData();
                files.forEach((f) => fd.append("images", f));

                try {
                  const res = await api.post("/api/admin/uploads/products", fd);
                  const urls = res?.images || [];
                  setImagesText((prev) => [...parseLines(prev), ...urls].join("\n"));
                } catch {
                  alert("Image upload failed");
                }
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {parseLines(imagesText).map((url, i) => (
                <img
                  key={i}
                  src={absUrl(url)}
                  alt=""
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>

            <textarea
              className={styles.textarea}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={3}
              placeholder="Or paste image URLs here (one per line)"
              style={{ marginTop: 10 }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Spiritual Use (optional)</label>
            <textarea className={styles.textarea} value={spiritualUse} onChange={(e) => setSpiritualUse(e.target.value)} rows={3} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Care & Handling (optional)</label>
            <textarea className={styles.textarea} value={careHandling} onChange={(e) => setCareHandling(e.target.value)} rows={3} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Shipping & Returns (optional)</label>
            <textarea className={styles.textarea} value={shippingReturns} onChange={(e) => setShippingReturns(e.target.value)} rows={3} />
          </div>

          {formErr ? <div className={styles.formErr}>{formErr}</div> : null}
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Product"
        message={`Delete "${toDelete?.title || ""}"? This cannot be undone.`}
        confirmText="Delete"
        danger
        loading={confirmLoading}
        onCancel={() => !confirmLoading && setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
