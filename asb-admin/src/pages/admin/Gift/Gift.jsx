import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import styles from "./Gift.module.css";

function toBool(v) {
  return !!v;
}

export default function Gift() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    enabled: true,
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImageUrl: "",
    giftWrapEnabled: true,
    giftWrapPrice: 0,
    maxGiftMessageLength: 200,
    presetsText: ""
  });

  async function load() {
    setLoading(true);
    setErr("");
    setOk("");
    try {
      const res = await api.get("/api/admin/gift-config");
      const c = res?.config || {};

      setForm({
        enabled: toBool(c.enabled),
        bannerTitle: c.bannerTitle || "",
        bannerSubtitle: c.bannerSubtitle || "",
        bannerImageUrl: c.bannerImageUrl || "",
        giftWrapEnabled: toBool(c.giftWrapEnabled),
        giftWrapPrice: Number(c.giftWrapPrice || 0),
        maxGiftMessageLength: Number(c.maxGiftMessageLength || 200),
        presetsText: Array.isArray(c.presets) ? c.presets.join("\n") : ""
      });
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to load gift settings");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const presets = String(form.presetsText || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const payload = {
        enabled: !!form.enabled,
        bannerTitle: String(form.bannerTitle || ""),
        bannerSubtitle: String(form.bannerSubtitle || ""),
        bannerImageUrl: String(form.bannerImageUrl || ""),
        giftWrapEnabled: !!form.giftWrapEnabled,
        giftWrapPrice: Number(form.giftWrapPrice || 0),
        maxGiftMessageLength: Number(form.maxGiftMessageLength || 0),
        presets
      };

      const res = await api.put("/api/admin/gift-config", payload);
      const c = res?.config || {};

      setOk("Saved successfully ✅");
      setForm((prev) => ({
        ...prev,
        presetsText: Array.isArray(c.presets) ? c.presets.join("\n") : prev.presetsText
      }));
    } catch (e) {
      setErr(e?.response?.message || e?.message || "Failed to save gift settings");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Gift Settings</h1>
          <div className={styles.sub}>Manage gift banner, gift wrap, and preset messages.</div>
        </div>

        <div className={styles.topBtns}>
          <button className={styles.btnGhost} onClick={load} disabled={loading || saving}>
            Refresh
          </button>
          <button className={styles.btnPrimary} onClick={save} disabled={loading || saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : err ? (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>Couldn’t load gift settings</div>
          <div className={styles.errorMsg}>{err}</div>
        </div>
      ) : (
        <>
          {ok ? <div className={styles.okBox}>{ok}</div> : null}

          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>Enable Gift Feature</div>

              <label className={styles.row}>
                <input
                  type="checkbox"
                  checked={!!form.enabled}
                  onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                />
                <span>Gift options enabled on client site</span>
              </label>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Banner</div>

              <label className={styles.field}>
                <div className={styles.label}>Banner Title</div>
                <input
                  className={styles.input}
                  value={form.bannerTitle}
                  onChange={(e) => setForm((p) => ({ ...p, bannerTitle: e.target.value }))}
                  placeholder="Make it a Gift!"
                />
              </label>

              <label className={styles.field}>
                <div className={styles.label}>Banner Subtitle</div>
                <input
                  className={styles.input}
                  value={form.bannerSubtitle}
                  onChange={(e) => setForm((p) => ({ ...p, bannerSubtitle: e.target.value }))}
                  placeholder="Add a message and gift wrap"
                />
              </label>

              <label className={styles.field}>
                <div className={styles.label}>Banner Image URL</div>
                <input
                  className={styles.input}
                  value={form.bannerImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, bannerImageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Gift Wrap</div>

              <label className={styles.row}>
                <input
                  type="checkbox"
                  checked={!!form.giftWrapEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, giftWrapEnabled: e.target.checked }))}
                />
                <span>Enable gift wrap option</span>
              </label>

              <label className={styles.field}>
                <div className={styles.label}>Gift Wrap Price (₹)</div>
                <input
                  className={styles.input}
                  type="number"
                  value={form.giftWrapPrice}
                  onChange={(e) => setForm((p) => ({ ...p, giftWrapPrice: e.target.value }))}
                />
              </label>

              <label className={styles.field}>
                <div className={styles.label}>Max Gift Message Length</div>
                <input
                  className={styles.input}
                  type="number"
                  value={form.maxGiftMessageLength}
                  onChange={(e) => setForm((p) => ({ ...p, maxGiftMessageLength: e.target.value }))}
                />
              </label>
            </section>

            <section className={styles.cardWide}>
              <div className={styles.cardTitle}>Preset Messages</div>
              <div className={styles.muted}>
                One message per line. These show as quick-select options for users.
              </div>

              <textarea
                className={styles.textarea}
                value={form.presetsText}
                onChange={(e) => setForm((p) => ({ ...p, presetsText: e.target.value }))}
                placeholder={"Happy Birthday!\nCongratulations!\nBest Wishes!"}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
