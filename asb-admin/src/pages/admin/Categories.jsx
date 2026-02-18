import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";
import { slugify } from "../../lib/slugify";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../components/ToastProvider";
import styles from "./Categories.module.css";
import { normalizeList, normalizeCategory } from "../../lib/normalize";

const GROUPS = [
  { value: "shop", label: "Shop" },
  { value: "gifts", label: "Gifts" },
];

export default function Categories() {
  const toast = useToast();

  const [groupFilter, setGroupFilter] = useState("shop");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [currentId, setCurrentId] = useState(null);

  const [group, setGroup] = useState("shop");
  const [sortOrder, setSortOrder] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.get("/api/categories", { query: { group: groupFilter } });
      const arr = normalizeList(data, ["categories", "items", "data"]);

      const normalized = arr.map((c) => {
        const base = normalizeCategory(c);
        return {
          ...base,
          group: c?.group || "shop",
          sortOrder: typeof c?.sortOrder === "number" ? c.sortOrder : Number(c?.sortOrder || 0),
        };
      });

      setItems(normalized);
    } catch (e) {
      setErr(getFriendlyMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupFilter]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const name = (x.name || "").toLowerCase();
      const slug = (x.slug || "").toLowerCase();
      return name.includes(s) || slug.includes(s);
    });
  }, [items, q]);

  function resetForm() {
    setGroup(groupFilter || "shop");
    setSortOrder(0);
    setName("");
    setSlug("");
    setIsActive(true);
    setFormErr("");
  }

  function openCreate() {
    setMode("create");
    setCurrentId(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(row) {
    setMode("edit");
    setCurrentId(row._id);

    setGroup(row.group || "shop");
    setSortOrder(Number(row.sortOrder || 0));
    setName(row.name || "");
    setSlug(row.slug || "");
    setIsActive(!!row.isActive);

    setFormErr("");
    setModalOpen(true);
  }

  async function onSave() {
    setFormErr("");

    const n = name.trim();
    if (!n) return setFormErr("Name is required.");

    const finalSlug = (slug || slugify(n)).trim();
    if (!finalSlug) return setFormErr("Slug is required.");

    setSaving(true);
    try {
      const payload = {
        group: String(group || "shop").toLowerCase(),
        sortOrder: Number(sortOrder || 0),
        name: n,
        slug: finalSlug,
        isActive: !!isActive,
      };

      if (mode === "create") {
        await api.post("/api/admin/categories", payload);
        toast.success("Category created");
      } else {
        await api.put(`/api/admin/categories/${currentId}`, payload);
        toast.success("Category updated");
      }

      setModalOpen(false);
      await load();
    } catch (e) {
      const msg = getFriendlyMessage(e);
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
      await api.del(`/api/admin/categories/${toDelete._id}`);
      toast.success("Category deleted");
      setConfirmOpen(false);
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(getFriendlyMessage(e));
    } finally {
      setConfirmLoading(false);
    }
  }

  const columns = [
    { key: "sortOrder", title: "Order", render: (r) => Number(r.sortOrder || 0) },
    { key: "name", title: "Name" },
    { key: "slug", title: "Slug" },
    {
      key: "isActive",
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
          <button className={styles.btnDanger} onClick={() => askDelete(r)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Categories</h1>
          <div className={styles.sub}>Only 2 groups: Shop + Gifts</div>
        </div>

        <button className={styles.btnPrimary} onClick={openCreate}>+ New Category</button>
      </div>

      <div className={styles.tools}>
        <select className={styles.select} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          {GROUPS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        <input className={styles.search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or slug…" />
        <button className={styles.btnGhost} onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load categories</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <Table columns={columns} rows={filtered} keyField="_id" emptyText="No categories yet." />
      )}

      <Modal
        title={mode === "create" ? "Create Category" : "Edit Category"}
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
          <div className={styles.field}>
            <label className={styles.label}>Group *</label>
            <select className={styles.select} value={group} onChange={(e) => setGroup(e.target.value)}>
              {GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Order</label>
            <input className={styles.input} type="number" value={Number(sortOrder || 0)} onChange={(e) => setSortOrder(Number(e.target.value || 0))} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slug) setSlug(slugify(v));
              }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Slug *</label>
            <input className={styles.input} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active</span>
          </label>

          {formErr ? <div className={styles.formErr}>{formErr}</div> : null}
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Category"
        message={`Delete "${toDelete?.name || ""}"? This cannot be undone.`}
        confirmText="Delete"
        danger
        loading={confirmLoading}
        onCancel={() => !confirmLoading && setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
