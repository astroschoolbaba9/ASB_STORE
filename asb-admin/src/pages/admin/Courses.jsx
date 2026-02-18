import { useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import { slugify } from "../../lib/slugify";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../components/ToastProvider";
import styles from "./Courses.module.css";
import { normalizeList } from "../../lib/normalize";

function normId(x) {
  return x?._id || x?.id || "";
}

const COURSE_CATEGORIES = ["General", "Beginner Programs", "Advanced Programs", "Certifications", "Workshops"];

function normalizeCourse(c) {
  return {
    _id: normId(c),
    title: c?.title || "",
    slug: c?.slug || "",
    description: c?.description || "",
    thumbnail: c?.thumbnail || "",
    category: c?.category || "General",

    price: typeof c?.price === "number" ? c.price : c?.price ? Number(c.price) : 0,
    mrp: typeof c?.mrp === "number" ? c.mrp : c?.mrp ? Number(c.mrp) : 0,
    isActive: typeof c?.isActive === "boolean" ? c.isActive : true,

    isFeatured: !!c?.isFeatured,
    featuredOrder: typeof c?.featuredOrder === "number" ? c.featuredOrder : Number(c?.featuredOrder || 0),

    lessons: Array.isArray(c?.lessons) ? c.lessons : [],
    lessonsCount: typeof c?.lessonsCount === "number" ? c.lessonsCount : Array.isArray(c?.lessons) ? c.lessons.length : 0,

    raw: c
  };
}

function toNumberOrEmpty(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

export default function Courses() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [category, setCategory] = useState("General");

  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(0);

  const [lessons, setLessons] = useState([]);

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [thumbUploading, setThumbUploading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function loadCourses() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get("/api/courses");
      const arr = normalizeList(data, ["courses"]);
      setItems(arr.map(normalizeCourse).filter((x) => x._id));
    } catch (e) {
      setErr(getFriendlyMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClient = useMemo(() => {
    const s = search.trim().toLowerCase();
    let arr = [...items];

    if (s) {
      arr = arr.filter((c) => {
        const t = (c.title || "").toLowerCase();
        const sl = (c.slug || "").toLowerCase();
        const d = (c.description || "").toLowerCase();
        const cat = (c.category || "").toLowerCase();
        return t.includes(s) || sl.includes(s) || d.includes(s) || cat.includes(s);
      });
    }

    if (sort === "priceAsc") arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "priceDesc") arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "titleAsc") arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sort === "featured") arr.sort((a, b) => (a.featuredOrder - b.featuredOrder) || (b.isFeatured - a.isFeatured));

    return arr;
  }, [items, search, sort]);

  function resetForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setThumbnail("");
    setCategory("General");

    setPrice("");
    setMrp("");
    setIsActive(true);

    setIsFeatured(false);
    setFeaturedOrder(0);

    setLessons([]);
    setFormErr("");
    setThumbUploading(false);
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

    setTitle(row.title || "");
    setSlug(row.slug || "");
    setDescription(row.description || "");
    setThumbnail(row.thumbnail || "");
    setCategory(row.category || row.raw?.category || "General");

    setPrice(row.price === 0 ? "0" : String(row.price || ""));
    setMrp(row.mrp === 0 ? "0" : String(row.mrp || ""));
    setIsActive(!!row.isActive);

    setIsFeatured(!!row.isFeatured);
    setFeaturedOrder(Number(row.featuredOrder || 0));

    setLessons(
      Array.isArray(row.lessons)
        ? row.lessons.map((l) => ({
          ...(l?._id ? { _id: l._id } : {}),
          title: l?.title || "",
          videoUrl: l?.videoUrl || "",
          durationSec: typeof l?.durationSec === "number" ? l.durationSec : Number(l?.durationSec || 0),
          isFreePreview: !!l?.isFreePreview
        }))
        : []
    );

    setFormErr("");
    setModalOpen(true);
  }

  function addLesson() {
    setLessons((prev) => [...prev, { title: "", videoUrl: "", durationSec: 0, isFreePreview: false }]);
  }

  function updateLesson(idx, patch) {
    setLessons((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLesson(idx) {
    setLessons((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadCourseThumbnail(file) {
    if (!file) return;
    setFormErr("");
    setThumbUploading(true);

    try {
      const fd = new FormData();
      fd.append("thumbnail", file);

      const res = await api.post("/api/admin/uploads/courses/thumbnail", fd);
      const url = res?.url || "";
      if (!url) throw new Error("Upload failed: no url returned");

      setThumbnail(url);
      toast.success("Thumbnail uploaded");
    } catch (e) {
      const msg = getFriendlyMessage(e);
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setThumbUploading(false);
    }
  }

  async function onSave() {
    setFormErr("");

    const t = title.trim();
    if (!t) return setFormErr("Title is required.");

    const finalSlug = (slug || slugify(t)).trim();
    if (!finalSlug) return setFormErr("Slug is required.");

    const pr = toNumberOrEmpty(price);
    if (pr === "" || Number(pr) < 0) return setFormErr("Price must be a valid number.");

    const m = toNumberOrEmpty(mrp);
    if (m !== "" && Number(m) < 0) return setFormErr("MRP must be a valid number.");

    const cleanedLessons = (Array.isArray(lessons) ? lessons : [])
      .map((l) => ({
        ...(l._id ? { _id: l._id } : {}),
        title: String(l.title || "").trim(),
        videoUrl: String(l.videoUrl || "").trim(),
        durationSec: Number(l.durationSec || 0),
        isFreePreview: !!l.isFreePreview
      }))
      .filter((l) => l.title);

    const payload = {
      title: t,
      slug: finalSlug,
      description: String(description || "").trim(),
      thumbnail: String(thumbnail || "").trim(),

      // ✅ category (important)
      category: String(category || "General"),

      price: Number(pr),
      mrp: m === "" ? 0 : Number(m),
      isActive: !!isActive,

      isFeatured: !!isFeatured,
      featuredOrder: Number(featuredOrder || 0),

      lessons: cleanedLessons
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/api/admin/courses", payload);
        toast.success("Course created");
      } else {
        await api.put(`/api/admin/courses/${currentId}`, payload);
        toast.success("Course updated");
      }

      setModalOpen(false);
      await loadCourses();
    } catch (e) {
      const msg = getFriendlyMessage(e);
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(row, nextVal) {
    setItems((prev) => prev.map((c) => (c._id === row._id ? { ...c, isFeatured: !!nextVal } : c)));
    try {
      await api.put(`/api/admin/courses/${row._id}`, { isFeatured: !!nextVal });
      toast.success(nextVal ? "Shown on Home" : "Removed from Home");
    } catch (e) {
      setItems((prev) => prev.map((c) => (c._id === row._id ? { ...c, isFeatured: !!row.isFeatured } : c)));
      toast.error(getFriendlyMessage(e));
    }
  }

  async function quickOrderUpdate(row, value) {
    const next = Number(value || 0);
    setItems((prev) => prev.map((c) => (c._id === row._id ? { ...c, featuredOrder: next } : c)));
    try {
      await api.put(`/api/admin/courses/${row._id}`, { featuredOrder: next });
      toast.success("Order updated");
    } catch (e) {
      toast.error(getFriendlyMessage(e));
      await loadCourses();
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
      await api.del(`/api/admin/courses/${toDelete._id}`);
      toast.success("Course deleted");
      setConfirmOpen(false);
      setToDelete(null);
      await loadCourses();
    } catch (e) {
      toast.error(getFriendlyMessage(e));
    } finally {
      setConfirmLoading(false);
    }
  }

  const columns = [
    {
      key: "title",
      title: "Course",
      render: (r) => (
        <div className={styles.courseCell}>
          <div className={styles.courseTitle}>{r.title || "-"}</div>
          <div className={styles.courseMeta}>
            <span className={styles.muted}>slug:</span> {r.slug || "-"}
          </div>
          <div className={styles.courseMeta}>
            <span className={styles.muted}>category:</span> {r.category || "General"}
          </div>
        </div>
      )
    },
    { key: "price", title: "Price", render: (r) => `₹${Number(r.price || 0)}` },
    { key: "lessons", title: "Lessons", render: (r) => Number(r.lessonsCount || 0) },
    {
      key: "home",
      title: "Home",
      render: (r) => (
        <div style={{ display: "grid", gap: 6 }}>
          <label className={styles.checkRow} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={!!r.isFeatured} onChange={(e) => toggleFeatured(r, e.target.checked)} />
            <span>{r.isFeatured ? "Featured" : "No"}</span>
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={styles.muted}>order</span>
            <input
              type="number"
              value={Number(r.featuredOrder || 0)}
              onChange={(e) => quickOrderUpdate(r, e.target.value)}
              style={{ width: 80, padding: 6, borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>
        </div>
      )
    },
    {
      key: "active",
      title: "Active",
      render: (r) => (
        <span className={r.isActive ? styles.badgeOn : styles.badgeOff}>{r.isActive ? "Active" : "Inactive"}</span>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={() => openEdit(r)}>Edit</button>
          <a className={styles.btnGhost} href={`/courses/${r._id}`} target="_blank" rel="noreferrer">Preview</a>
          <button className={styles.btnDanger} onClick={() => askDelete(r)}>Delete</button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Courses</h1>
          <div className={styles.sub}>Manage courses + category + Home ordering</div>
        </div>

        <button className={styles.btnPrimary} onClick={openCreate}>+ New Course</button>
      </div>

      <div className={styles.tools}>
        <input className={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />

        <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Sort: Newest</option>
          <option value="titleAsc">Sort: Title (A-Z)</option>
          <option value="priceAsc">Sort: Price (Low → High)</option>
          <option value="priceDesc">Sort: Price (High → Low)</option>
          <option value="featured">Sort: Featured Order</option>
        </select>

        <button className={styles.btnGhost} onClick={loadCourses}>Refresh</button>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load courses</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <Table columns={columns} rows={filteredClient} keyField="_id" emptyText="No courses found." />
      )}

      <Modal
        title={mode === "create" ? "Create Course" : "Edit Course"}
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <button className={styles.btnGhost} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className={styles.btnPrimary} onClick={onSave} disabled={saving || thumbUploading}>
              {saving ? "Saving..." : thumbUploading ? "Uploading..." : "Save"}
            </button>
          </>
        }
      >
        <div className={styles.formGrid}>
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
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Slug *</label>
            <input className={styles.input} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Training Category</label>
            <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving || thumbUploading}>
              {COURSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Thumbnail (Upload from Computer)</label>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept="image/*"
                disabled={thumbUploading || saving}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCourseThumbnail(f);
                  e.target.value = "";
                }}
              />
              {thumbUploading ? <span className={styles.muted}>Uploading...</span> : null}
            </div>

            {thumbnail ? (
              <div style={{ marginTop: 10 }}>
                <div className={styles.muted} style={{ marginBottom: 6 }}>Preview</div>
                <img
                  src={absUrl(thumbnail)}
                  alt="thumbnail"
                  style={{ width: 220, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Thumbnail URL</label>
            <input className={styles.input} value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Price *</label>
              <input className={styles.input} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>MRP</label>
              <input className={styles.input} value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className={styles.fieldRow} style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>Active</span>
            </label>

            <label className={styles.checkRow}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span>Show on Home</span>
            </label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={styles.muted}>order</span>
              <input
                type="number"
                value={Number(featuredOrder || 0)}
                onChange={(e) => setFeaturedOrder(Number(e.target.value || 0))}
                className={styles.input}
                style={{ width: 120 }}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className={styles.field}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <label className={styles.label} style={{ marginBottom: 0 }}>Lessons</label>
              <button type="button" className={styles.btnGhost} onClick={addLesson}>+ Add Lesson</button>
            </div>

            {lessons.length === 0 ? (
              <div className={styles.hint} style={{ marginTop: 8 }}>No lessons yet.</div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {lessons.map((l, idx) => (
                  <div key={l._id || idx} className={styles.lessonCard}>
                    <div className={styles.row2}>
                      <div className={styles.field}>
                        <label className={styles.label}>Lesson Title *</label>
                        <input className={styles.input} value={l.title} onChange={(e) => updateLesson(idx, { title: e.target.value })} />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Duration (sec)</label>
                        <input
                          className={styles.input}
                          value={String(l.durationSec ?? 0)}
                          onChange={(e) => updateLesson(idx, { durationSec: Number(e.target.value || 0) })}
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Video URL</label>
                      <input className={styles.input} value={l.videoUrl} onChange={(e) => updateLesson(idx, { videoUrl: e.target.value })} />
                    </div>

                    <div className={styles.fieldRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className={styles.checkRow}>
                        <input type="checkbox" checked={!!l.isFreePreview} onChange={(e) => updateLesson(idx, { isFreePreview: e.target.checked })} />
                        <span>Free Preview</span>
                      </label>

                      <button type="button" className={styles.btnDanger} onClick={() => removeLesson(idx)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formErr ? <div className={styles.formErr}>{formErr}</div> : null}
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Course"
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
