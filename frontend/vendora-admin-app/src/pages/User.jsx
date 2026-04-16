import { useState, useEffect, useCallback } from "react";
import API from "../axios/api"
import "../styles/User.css";

// ── Icons (inline SVG so no extra deps) ───────────────────────────────────────
const Icon = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── API calls (wired to your actual endpoints) ────────────────────────────────
const fetchAllUsers    = ()              => API.get("/user/all").then((r) => r.data);
const fetchByDistrict  = (d)             => API.get(`/user/district/${d}`).then((r) => r.data);
const fetchByEmail     = (e)             => API.get(`/user/email/${encodeURIComponent(e)}`).then((r) => r.data);
const fetchById        = (id)            => API.get(`/user/${id}`).then((r) => r.data);
const patchUser        = (id, body)      => API.patch(`/user/${id}`, body).then((r) => r.data);
const createUser       = (body)          => API.post("/user/create", body).then((r) => r.data);

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ user }) {
  const [imgErr, setImgErr] = useState(false);
  if (user.profilePhotoUrl && !imgErr) {
    return (
      <img
        className="um-avatar-img"
        src={user.profilePhotoUrl}
        alt={user.userName}
        onError={() => setImgErr(true)}
      />
    );
  }
  return <div className="um-avatar-fallback">{initials(user.userName)}</div>;
}

function StatusBadge({ active }) {
  return (
    <span className={`um-badge ${active ? "um-badge--active" : "um-badge--inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DistrictChip({ district }) {
  if (!district) return <span className="um-chip um-chip--none">—</span>;
  return <span className={`um-chip um-chip--${district.toLowerCase()}`}>{district}</span>;
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function UserDrawer({ userId, onClose, onUpdated }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit]     = useState(false);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  useEffect(() => {
    setLoading(true);
    fetchById(userId)
      .then((u) => { setUser(u); setForm({ userName: u.userName, phone: u.phone || "", district: u.district || "" }); })
      .catch(() => setErr("Failed to load user."))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const updated = await patchUser(userId, {
        userName: form.userName || undefined,
        phone:    form.phone    || undefined,
        district: form.district || undefined,
      });
      setUser(updated);
      setEdit(false);
      onUpdated(updated);
    } catch {
      setErr("Update failed. Check inputs.");
    } finally { setSaving(false); }
  };

  return (
    <div className="um-drawer-overlay" onClick={onClose}>
      <aside className="um-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="um-drawer-close" onClick={onClose}><Icon.Close /></button>

        {loading && <div className="um-drawer-loading"><div className="um-spinner" /></div>}
        {!loading && !user && <p className="um-drawer-err">{err || "User not found."}</p>}

        {user && (
          <>
            <div className="um-drawer-hero">
              <div className="um-drawer-avatar"><Avatar user={user} /></div>
              <h2 className="um-drawer-name">{user.userName}</h2>
              <p className="um-drawer-email">{user.email}</p>
              <div className="um-drawer-badges">
                <StatusBadge active={user.active} />
                <DistrictChip district={user.district} />
              </div>
            </div>

            <div className="um-drawer-section">
              <h3>Contact</h3>
              <div className="um-drawer-row"><Icon.Phone /><span>{user.phone || "—"}</span></div>
              <div className="um-drawer-row"><Icon.Mail /><span>{user.email}</span></div>
            </div>

            <div className="um-drawer-section">
              <h3>Location</h3>
              {user.locationSet ? (
                <div className="um-drawer-row">
                  <Icon.MapPin />
                  <span>{user.latitude?.toFixed(5)}, {user.longitude?.toFixed(5)}</span>
                </div>
              ) : (
                <p className="um-muted">Location not set</p>
              )}
            </div>

            <div className="um-drawer-section">
              <h3>Meta</h3>
              <div className="um-drawer-meta">
                <div><span>ID</span><code>{user.id}</code></div>
                <div><span>Joined</span><code>{fmt(user.createdAt)}</code></div>
                <div><span>Updated</span><code>{fmt(user.updatedAt)}</code></div>
              </div>
            </div>

            {!edit ? (
              <button className="um-btn um-btn--primary" onClick={() => setEdit(true)}>Edit User</button>
            ) : (
              <div className="um-drawer-form">
                <h3>Edit Details</h3>
                {err && <p className="um-drawer-err">{err}</p>}
                <label>Name
                  <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
                </label>
                <label>Phone
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit" />
                </label>
                <label>District
                  <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                    <option value="">— select —</option>
                    <option value="COIMBATORE">Coimbatore</option>
                    <option value="PALAKKAD">Palakkad</option>
                  </select>
                </label>
                <div className="um-drawer-actions">
                  <button className="um-btn um-btn--ghost" onClick={() => setEdit(false)}>Cancel</button>
                  <button className="um-btn um-btn--primary" onClick={save} disabled={saving}>
                    {saving ? <span className="um-spinner um-spinner--sm" /> : <><Icon.Check /> Save</>}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ userName: "", email: "", phone: "", district: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState("");

  const submit = async () => {
    setSaving(true); setErr("");
    try {
      const u = await createUser({
        userName: form.userName,
        email:    form.email,
        phone:    form.phone   || undefined,
        district: form.district || undefined,
      });
      onCreated(u);
      onClose();
    } catch {
      setErr("Creation failed. Check all fields.");
    } finally { setSaving(false); }
  };

  return (
    <div className="um-drawer-overlay" onClick={onClose}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal-header">
          <h2>New User</h2>
          <button className="um-drawer-close" onClick={onClose}><Icon.Close /></button>
        </div>
        {err && <p className="um-drawer-err">{err}</p>}
        <div className="um-modal-body">
          <label>Name *
            <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
          </label>
          <label>Email *
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit" />
          </label>
          <label>District
            <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              <option value="">— select —</option>
              <option value="COIMBATORE">Coimbatore</option>
              <option value="PALAKKAD">Palakkad</option>
            </select>
          </label>
        </div>
        <div className="um-drawer-actions">
          <button className="um-btn um-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="um-btn um-btn--primary" onClick={submit} disabled={saving}>
            {saving ? <span className="um-spinner um-spinner--sm" /> : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [activeFilter, setActiveFilter]     = useState("ALL");
  const [selectedId, setSelectedId]         = useState(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [stats, setStats]         = useState({ total: 0, active: 0, cbe: 0, pkd: 0 });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      let data;
      if (districtFilter !== "ALL") data = await fetchByDistrict(districtFilter);
      else                           data = await fetchAllUsers();
      setUsers(data);
      setStats({
        total:  data.length,
        active: data.filter((u) => u.active).length,
        cbe:    data.filter((u) => u.district === "COIMBATORE").length,
        pkd:    data.filter((u) => u.district === "PALAKKAD").length,
      });
    } catch { setError("Could not load users. Check your session."); }
    finally  { setLoading(false); }
  }, [districtFilter]);

  useEffect(() => { load(); }, [load]);

  const visible = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.userName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q);
    const matchActive =
      activeFilter === "ALL" ||
      (activeFilter === "ACTIVE" && u.active) ||
      (activeFilter === "INACTIVE" && !u.active);
    return matchSearch && matchActive;
  });

  const onUpdated = (updated) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  const onCreated = (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
    setStats((s) => ({ ...s, total: s.total + 1, active: newUser.active ? s.active + 1 : s.active }));
  };

  return (
    <div className="um-root">
      {/* Sidebar accent */}
      <div className="um-accent-bar" />

      <main className="um-main">
        {/* ── Header ── */}
        <header className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon"><Icon.Users /></div>
            <div>
              <h1 className="um-title">User Management</h1>
              <p className="um-subtitle">Vendora Admin Console</p>
            </div>
          </div>
          <div className="um-header-right">
            <button className="um-btn um-btn--ghost um-btn--icon" onClick={load} title="Refresh">
              <Icon.Refresh />
            </button>
            <button className="um-btn um-btn--primary" onClick={() => setShowCreate(true)}>
              + New User
            </button>
          </div>
        </header>

        {/* ── Stats ── */}
        <div className="um-stats">
          {[
            { label: "Total Users",  val: stats.total  },
            { label: "Active",       val: stats.active  },
            { label: "Coimbatore",   val: stats.cbe     },
            { label: "Palakkad",     val: stats.pkd     },
          ].map((s) => (
            <div className="um-stat-card" key={s.label}>
              <span className="um-stat-val">{s.val}</span>
              <span className="um-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="um-toolbar">
          <div className="um-search-wrap">
            <span className="um-search-icon"><Icon.Search /></span>
            <input
              className="um-search"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="um-search-clear" onClick={() => setSearch("")}><Icon.Close /></button>
            )}
          </div>

          <div className="um-filters">
            <span className="um-filter-label"><Icon.Filter /></span>
            <select
              className="um-select"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="ALL">All Districts</option>
              <option value="COIMBATORE">Coimbatore</option>
              <option value="PALAKKAD">Palakkad</option>
            </select>
            <select
              className="um-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        {error && <div className="um-error">{error}</div>}

        {loading ? (
          <div className="um-loading-state">
            {[...Array(5)].map((_, i) => <div className="um-skeleton-row" key={i} />)}
          </div>
        ) : (
          <div className="um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={8} className="um-empty">No users match your filters.</td></tr>
                )}
                {visible.map((u) => (
                  <tr key={u.id} className="um-tr" onClick={() => setSelectedId(u.id)}>
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar"><Avatar user={u} /></div>
                        <span className="um-user-name">{u.userName || "—"}</span>
                      </div>
                    </td>
                    <td className="um-muted">{u.email}</td>
                    <td className="um-muted">{u.phone || "—"}</td>
                    <td><DistrictChip district={u.district} /></td>
                    <td><StatusBadge active={u.active} /></td>
                    <td>
                      {u.locationSet
                        ? <span className="um-loc-set"><Icon.MapPin /> Set</span>
                        : <span className="um-loc-unset">—</span>}
                    </td>
                    <td className="um-muted">{fmt(u.createdAt)}</td>
                    <td>
                      <button
                        className="um-btn um-btn--ghost um-btn--icon um-view-btn"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(u.id); }}
                        title="View"
                      >
                        <Icon.Eye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="um-table-footer">
              Showing <strong>{visible.length}</strong> of <strong>{users.length}</strong> users
            </div>
          </div>
        )}
      </main>

      {/* ── Drawer ── */}
      {selectedId && (
        <UserDrawer
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={onUpdated}
        />
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}