import { useEffect, useMemo, useState } from "react";
import styles from "./ProfilePage.module.css";
import useRequireAuth from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { getFriendlyMessage } from "../../utils/errorMapping";

const emptyAddress = {
  _id: "",
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isDefault: false
};

export default function Profile() {
  const requireAuth = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [initialProfile, setInitialProfile] = useState({ name: "", email: "", phone: "" });

  // addresses
  const [addresses, setAddresses] = useState([]);

  // modal
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrMode, setAddrMode] = useState("add"); // add | edit
  const [addrDraft, setAddrDraft] = useState(emptyAddress);

  const defaultAddressId = useMemo(() => {
    const d = (addresses || []).find((a) => a.isDefault);
    return d?._id || "";
  }, [addresses]);

  async function loadAll() {
    await requireAuth(async () => {
      setLoading(true);
      setErr("");

      try {
        const meRes = await api.get("/api/me");
        const u = meRes?.user || meRes?.data?.user || meRes?.user || null;

        const nextProfile = {
          name: u?.name || "",
          email: u?.email || "",
          phone: u?.phone || ""
        };

        setName(nextProfile.name);
        setEmail(nextProfile.email);
        setPhone(nextProfile.phone);
        setInitialProfile(nextProfile);

        const addrRes = await api.get("/api/me/addresses");
        setAddresses(Array.isArray(addrRes?.addresses) ? addrRes.addresses : []);
      } catch (e) {
        setErr(getFriendlyMessage(e));
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCancelProfile = () => {
    setName(initialProfile.name);
    setEmail(initialProfile.email);
    setPhone(initialProfile.phone);
  };

  const onSaveProfile = async () => {
    await requireAuth(async () => {
      setSaving(true);
      setErr("");
      try {
        const res = await api.put("/api/me", { name, email, phone });
        const u = res?.user || res?.data?.user || res?.user || null;

        const nextProfile = {
          name: u?.name || name,
          email: u?.email || email,
          phone: u?.phone || phone
        };

        setInitialProfile(nextProfile);
        setName(nextProfile.name);
        setEmail(nextProfile.email);
        setPhone(nextProfile.phone);
      } catch (e) {
        setErr(getFriendlyMessage(e));
      } finally {
        setSaving(false);
      }
    });
  };

  const openAddAddress = () => {
    setAddrMode("add");
    setAddrDraft({ ...emptyAddress, isDefault: addresses.length === 0 });
    setAddrOpen(true);
  };

  const openEditAddress = (a) => {
    setAddrMode("edit");
    setAddrDraft({
      _id: a?._id || "",
      label: a?.label || "Home",
      fullName: a?.fullName || "",
      phone: a?.phone || "",
      line1: a?.line1 || "",
      line2: a?.line2 || "",
      city: a?.city || "",
      state: a?.state || "",
      pincode: a?.pincode || "",
      landmark: a?.landmark || "",
      isDefault: !!a?.isDefault
    });
    setAddrOpen(true);
  };

  const saveAddress = async () => {
    await requireAuth(async () => {
      setSaving(true);
      setErr("");

      try {
        const payload = {
          label: addrDraft.label,
          fullName: addrDraft.fullName,
          phone: addrDraft.phone,
          line1: addrDraft.line1,
          line2: addrDraft.line2,
          city: addrDraft.city,
          state: addrDraft.state,
          pincode: addrDraft.pincode,
          landmark: addrDraft.landmark,
          isDefault: !!addrDraft.isDefault
        };

        let res;
        if (addrMode === "edit" && addrDraft._id) {
          res = await api.put(`/api/me/addresses/${addrDraft._id}`, payload);
        } else {
          res = await api.post("/api/me/addresses", payload);
        }

        setAddresses(Array.isArray(res?.addresses) ? res.addresses : []);
        setAddrOpen(false);
      } catch (e) {
        setErr(getFriendlyMessage(e));
      } finally {
        setSaving(false);
      }
    });
  };

  const removeAddress = async (id) => {
    const ok = window.confirm("Remove this address?");
    if (!ok) return;

    await requireAuth(async () => {
      setSaving(true);
      setErr("");
      try {
        const res = await api.del(`/api/me/addresses/${id}`);
        setAddresses(Array.isArray(res?.addresses) ? res.addresses : []);
      } catch (e) {
        setErr(getFriendlyMessage(e));
      } finally {
        setSaving(false);
      }
    });
  };

  const setDefault = async (id) => {
    await requireAuth(async () => {
      setSaving(true);
      setErr("");
      try {
        const res = await api.patch(`/api/me/addresses/${id}/default`, {});
        setAddresses(Array.isArray(res?.addresses) ? res.addresses : []);
      } catch (e) {
        setErr(getFriendlyMessage(e));
      } finally {
        setSaving(false);
      }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* Profile */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>Profile</div>
          <p className={styles.sub}>Manage your personal details.</p>

          {err ? <div className={styles.hint} style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}

          {loading ? (
            <div className={styles.sub}>Loading…</div>
          ) : (
            <>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Mobile</label>
                  <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className="btn-outline" onClick={onCancelProfile} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={onSaveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Address Book */}
        <section className={styles.card}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitle}>Address Book</div>
            <button type="button" className="btn-outline" onClick={openAddAddress} disabled={saving || loading}>
              + Add Address
            </button>
          </div>

          {loading ? (
            <div className={styles.sub}>Loading…</div>
          ) : (addresses || []).length === 0 ? (
            <div className={styles.sub}>No addresses saved yet.</div>
          ) : (
            <div className={styles.addressList}>
              {addresses.map((a) => (
                <div key={a._id} className={styles.addressCard}>
                  <div className={styles.addrTop}>
                    <div className={styles.addrLabel}>
                      <span className={styles.addrTag}>{a.label || "Address"}</span>
                      {a.isDefault ? <span className={styles.defaultPill}>Default</span> : null}
                    </div>

                    <div className={styles.addrActions}>
                      {!a.isDefault ? (
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => setDefault(a._id)}
                          disabled={saving}
                          title="Set as default"
                        >
                          Make Default
                        </button>
                      ) : null}

                      <button type="button" className={styles.smallBtn} onClick={() => openEditAddress(a)} disabled={saving}>
                        Edit
                      </button>
                      <button type="button" className={styles.smallBtn} onClick={() => removeAddress(a._id)} disabled={saving}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className={styles.addrName}>{a.fullName || "-"}</div>
                  <div className={styles.addrLine}>{a.phone || "-"}</div>
                  <div className={styles.addrLine}>{a.line1 || "-"}</div>
                  <div className={styles.addrLine}>
                    {(a.city || "-") + ", " + (a.state || "-") + " • " + (a.pincode || "-")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {addrOpen ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setAddrOpen(false)}   // ✅ click outside closes
        >
          <div
            className={styles.modalCard}
            onMouseDown={(e) => e.stopPropagation()} // ✅ click inside doesn't close
          >
            <div className={styles.modalHead}>
              <div className={styles.cardTitle}>
                {addrMode === "edit" ? "Edit Address" : "Add Address"}
              </div>
              <button type="button" className={styles.modalX} onClick={() => setAddrOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Label</label>
                <input
                  className={styles.input}
                  value={addrDraft.label}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Home / Office"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.input}
                  value={addrDraft.fullName}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input
                  className={styles.input}
                  value={addrDraft.phone}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Address Line 1</label>
                <input
                  className={styles.input}
                  value={addrDraft.line1}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, line1: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Address Line 2</label>
                <input
                  className={styles.input}
                  value={addrDraft.line2}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, line2: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <input
                  className={styles.input}
                  value={addrDraft.city}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, city: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>State</label>
                <input
                  className={styles.input}
                  value={addrDraft.state}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, state: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Pincode</label>
                <input
                  className={styles.input}
                  value={addrDraft.pincode}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, pincode: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Landmark</label>
                <input
                  className={styles.input}
                  value={addrDraft.landmark}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, landmark: e.target.value }))}
                />
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={!!addrDraft.isDefault}
                  disabled={addrDraft._id && defaultAddressId === addrDraft._id}
                  onChange={(e) => setAddrDraft((p) => ({ ...p, isDefault: e.target.checked }))}
                />
                <span>Set as default</span>
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn-outline" onClick={() => setAddrOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveAddress} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
