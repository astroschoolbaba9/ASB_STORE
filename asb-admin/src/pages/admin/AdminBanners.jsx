import { useEffect, useMemo, useRef, useState } from "react";
import { api, API_BASE } from "../../lib/api";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import Table from "../../components/Table";
import { useToast } from "../../components/ToastProvider";
import styles from "./AdminBanners.module.css";

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

function normId(x) {
  return x?._id || x?.id || "";
}

function toLocalInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeBanner(b) {
  return {
    _id: normId(b),
    title: b?.title || "",
    subtitle: b?.subtitle || "",
    imageUrl: absUrl(b?.imageUrl || ""),
    clickUrl: b?.clickUrl || "",
    ctaPrimaryText: b?.ctaPrimaryText || "Book Consultation",
    ctaPrimaryLink: b?.ctaPrimaryLink || "/contact",
    ctaSecondaryText: b?.ctaSecondaryText || "Explore Products",
    ctaSecondaryLink: b?.ctaSecondaryLink || "/shop",
    order: typeof b?.order === "number" ? b.order : Number(b?.order || 0),
    isActive: !!b?.isActive,
    startAt: b?.startAt || null,
    endAt: b?.endAt || null,
    createdAt: b?.createdAt || "",
    raw: b
  };
}

export default function AdminBanners() {
  const toast = useToast();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState("");

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // form
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [clickUrl, setClickUrl] = useState("");

  const [ctaPrimaryText, setCtaPrimaryText] = useState("Book Consultation");
  const [ctaPrimaryLink, setCtaPrimaryLink] = useState("/contact");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("Explore Products");
  const [ctaSecondaryLink, setCtaSecondaryLink] = useState("/shop");

  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // ✅ scheduling
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // file
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/admin/banners");
      const arr = Array.isArray(res?.items) ? res.items : [];
      setItems(arr.map(normalizeBanner));
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to load banners");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const rows = useMemo(() => {
    return [...items].sort((a, b) => (a.order - b.order) || (String(b.createdAt).localeCompare(String(a.createdAt))));
  }, [items]);

  function resetForm() {
    setTitle("");
    setSubtitle("");
    setClickUrl("");
    setCtaPrimaryText("Book Consultation");
    setCtaPrimaryLink("/contact");
    setCtaSecondaryText("Explore Products");
    setCtaSecondaryLink("/shop");
    setOrder(0);
    setIsActive(true);

    setStartAt("");
    setEndAt("");

    setFile(null);
    setPreviewUrl("");
    setFormErr("");

    if (fileRef.current) fileRef.current.value = "";
  }

  function openCreate() {
    setMode("create");
    setCurrentId("");
    resetForm();
    setModalOpen(true);
  }

  function openEdit(b) {
    setMode("edit");
    setCurrentId(b._id);

    setTitle(b.title || "");
    setSubtitle(b.subtitle || "");
    setClickUrl(b.clickUrl || "");
    setCtaPrimaryText(b.ctaPrimaryText || "Book Consultation");
    setCtaPrimaryLink(b.ctaPrimaryLink || "/contact");
    setCtaSecondaryText(b.ctaSecondaryText || "Explore Products");
    setCtaSecondaryLink(b.ctaSecondaryLink || "/shop");
    setOrder(typeof b.order === "number" ? b.order : 0);
    setIsActive(!!b.isActive);

    setStartAt(toLocalInputValue(b.startAt));
    setEndAt(toLocalInputValue(b.endAt));

    setFile(null);
    setPreviewUrl(b.imageUrl || "");
    setFormErr("");

    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  }

  function onPickFile(f) {
    setFile(f || null);
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function onSave(e) {
    e?.preventDefault?.();
    setFormErr("");

    if (!title.trim()) return setFormErr("Title is required.");
    if (mode === "create" && !file) return setFormErr("Please choose an image file.");

    setSaving(true);
    try {
      if (mode === "create") {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("subtitle", String(subtitle || ""));
        fd.append("clickUrl", String(clickUrl || ""));
        fd.append("ctaPrimaryText", String(ctaPrimaryText || "Book Consultation"));
        fd.append("ctaPrimaryLink", String(ctaPrimaryLink || "/contact"));
        fd.append("ctaSecondaryText", String(ctaSecondaryText || "Explore Products"));
        fd.append("ctaSecondaryLink", String(ctaSecondaryLink || "/shop"));
        fd.append("order", String(Number(order || 0)));
        fd.append("isActive", String(!!isActive));

        // ✅ schedule
        fd.append("startAt", startAt || "");
        fd.append("endAt", endAt || "");

        fd.append("image", file);

        await api.post("/api/admin/banners", fd, { headers: {} });
        toast.success("Banner created");
      } else {
        if (file) {
          const fd = new FormData();
          fd.append("title", title.trim());
          fd.append("subtitle", String(subtitle || ""));
          fd.append("clickUrl", String(clickUrl || ""));
          fd.append("ctaPrimaryText", String(ctaPrimaryText || "Book Consultation"));
          fd.append("ctaPrimaryLink", String(ctaPrimaryLink || "/contact"));
          fd.append("ctaSecondaryText", String(ctaSecondaryText || "Explore Products"));
          fd.append("ctaSecondaryLink", String(ctaSecondaryLink || "/shop"));
          fd.append("order", String(Number(order || 0)));
          fd.append("isActive", String(!!isActive));

          fd.append("startAt", startAt || "");
          fd.append("endAt", endAt || "");

          fd.append("image", file);

          await api.patch(`/api/admin/banners/${currentId}`, fd, { headers: {} });
        } else {
          await api.patch(`/api/admin/banners/${currentId}`, {
            title: title.trim(),
            subtitle: String(subtitle || ""),
            clickUrl: String(clickUrl || ""),
            ctaPrimaryText: String(ctaPrimaryText || "Book Consultation"),
            ctaPrimaryLink: String(ctaPrimaryLink || "/contact"),
            ctaSecondaryText: String(ctaSecondaryText || "Explore Products"),
            ctaSecondaryLink: String(ctaSecondaryLink || "/shop"),
            order: Number(order || 0),
            isActive: !!isActive,
            startAt: startAt || null,
            endAt: endAt || null
          });
        }

        toast.success("Banner updated");
      }

      setModalOpen(false);
      resetForm();
      await load();
    } catch (e2) {
      const msg = e2?.response?.message || e2?.message || "Save failed";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b) {
    try {
      await api.patch(`/api/admin/banners/${b._id}`, { isActive: !b.isActive });
      toast.success(b.isActive ? "Banner disabled" : "Banner enabled");
      await load();
    } catch (e) {
      toast.error(e?.response?.message || e?.message || "Failed to update banner");
    }
  }

  function askDelete(b) {
    setToDelete(b);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete?._id) return;
    setConfirmLoading(true);
    try {
      await api.del(`/api/admin/banners/${toDelete._id}`);
      toast.success("Banner deleted");
      setConfirmOpen(false);
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.message || e?.message || "Delete failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  const columns = [
    {
      key: "preview",
      title: "Preview",
      render: (b) => (
        <div className={styles.previewCell}>
          <img className={styles.previewImg} src={b.imageUrl} alt={b.title || "banner"} />
        </div>
      )
    },
    {
      key: "title",
      title: "Banner",
      render: (b) => (
        <div className={styles.titleCell}>
          <div className={styles.bannerTitle}>{b.title || "(no title)"}</div>
          {b.subtitle ? <div className={styles.bannerSub}>{b.subtitle}</div> : null}

          <div className={styles.metaRow}>
            <span className={styles.muted}>order:</span> {b.order}
            <span className={styles.dot}>•</span>
            <span className={b.isActive ? styles.badgeOn : styles.badgeOff}>{b.isActive ? "Active" : "Inactive"}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.muted}>start:</span> {b.startAt ? new Date(b.startAt).toLocaleString() : "—"}
            <span className={styles.dot}>•</span>
            <span className={styles.muted}>end:</span> {b.endAt ? new Date(b.endAt).toLocaleString() : "—"}
          </div>
        </div>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (b) => (
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={() => openEdit(b)} type="button">Edit</button>
          <button className={styles.btnGhost} onClick={() => toggleActive(b)} type="button">{b.isActive ? "Disable" : "Enable"}</button>
          <button className={styles.btnDanger} onClick={() => askDelete(b)} type="button">Delete</button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Banners</h1>
          <div className={styles.sub}>Upload banners + schedule visibility</div>
        </div>

        <div className={styles.topRight}>
          <button className={styles.btnGhost} onClick={load} type="button">Refresh</button>
          <button className={styles.btnPrimary} onClick={openCreate} type="button">+ New Banner</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load banners</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <Table columns={columns} rows={rows} keyField="_id" emptyText="No banners yet." />
      )}

      <Modal
        title={mode === "create" ? "Create Banner" : "Edit Banner"}
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <button className={styles.btnGhost} type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className={styles.btnPrimary} type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form className={styles.formGrid} onSubmit={onSave}>
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subtitle</label>
            <input className={styles.input} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Start At (optional)</label>
              <input type="datetime-local" className={styles.input} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End At (optional)</label>
              <input type="datetime-local" className={styles.input} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label}>Order</label>
              <input className={styles.input} type="number" value={order} onChange={(e) => setOrder(Number(e.target.value || 0))} />
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className={styles.uploadGrid}>
            <div className={styles.uploadBox}>
              <div className={styles.uploadTitle}>Banner Image {mode === "create" ? "*" : "(optional)"}</div>

              <div
                className={styles.dropZone}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPickFile(f);
                }}
              >
                <div className={styles.dropText}>Drag & drop image here <span className={styles.muted}>or</span></div>
                <button className={styles.btnGhost} type="button" onClick={() => fileRef.current?.click()}>Choose File</button>

                <input
                  ref={fileRef}
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                />

                {file ? <div className={styles.fileName}>{file.name}</div> : null}
              </div>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.uploadTitle}>Preview</div>
              {previewUrl ? <img className={styles.previewLarge} src={previewUrl} alt="preview" /> : <div className={styles.previewEmpty}>No image</div>}
            </div>
          </div>

          {formErr ? <div className={styles.formErr}>{formErr}</div> : null}
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Banner"
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
