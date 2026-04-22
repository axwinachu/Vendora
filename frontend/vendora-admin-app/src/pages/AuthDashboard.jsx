import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/auth-dashboard.css";
import API from "../axios/api";

// ── api helpers — thin wrappers so every call goes through the axios instance ──
const api = {
  get:    (url)        => API.get(url).then(r => r.data),
  post:   (url, body)  => API.post(url, body).then(r => r.data),
  patch:  (url, body)  => API.patch(url, body).then(r => r.data),
  delete: (url, body)  => body
    ? API.delete(url, { data: body }).then(r => r.data)
    : API.delete(url).then(r => r.data),
};

const BASE = "/auth/admin";

// ── Tiny helpers ───────────────────────────────────────────────────────────────
const initials = u =>
  ((u?.firstName?.[0] || "") + (u?.lastName?.[0] || "") || u?.username?.[0] || "?").toUpperCase();

const avatarColor = str => {
  const colors = ["#0ea5e9","#06b6d4","#8b5cf6","#f59e0b","#10b981","#ef4444","#ec4899"];
  let h = 0;
  for (let c of (str || "")) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

// ── Valid realm roles — must match backend VALID_REALM_ROLES ───────────────────
const REALM_ROLES = ["ADMIN", "PROVIDER", "USER"];

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = {
  Users:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Plus:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Key:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Swap:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  Shield:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  X:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Refresh:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Eye:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Lock:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="ad-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`ad-toast ad-toast--${t.type}`}>
          <span className="ad-toast__icon">{t.type === "ok" ? <Icon.Check /> : <Icon.X />}</span>
          <span className="ad-toast__msg">{t.message}</span>
          <button className="ad-toast__close" onClick={() => remove(t.id)}><Icon.X /></button>
        </div>
      ))}
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="ad-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal">
        <div className="ad-modal__head">
          <h3 className="ad-modal__title">{title}</h3>
          <button className="ad-modal__close" onClick={onClose}><Icon.X /></button>
        </div>
        <div className="ad-modal__body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="ad-field">
      <label className="ad-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, accent, delay }) {
  return (
    <div className="ad-stat" style={{ animationDelay: `${delay}s` }}>
      <div className="ad-stat__icon" style={{ color: accent, borderColor: accent + "33", background: accent + "11" }}>{icon}</div>
      <div className="ad-stat__body">
        <p className="ad-stat__val">{value}</p>
        <p className="ad-stat__label">{label}</p>
      </div>
      <div className="ad-stat__line" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AuthDashboard() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [searchFld,  setSearchFld]  = useState({ username: "", email: "", firstName: "", lastName: "" });
  const [page,       setPage]       = useState(0);
  const [toasts,     setToasts]     = useState([]);
  const [modal,      setModal]      = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [busy,       setBusy]       = useState(false);
  const toastId = useRef(0);

  // Form states
  const [createForm,     setCreateForm]     = useState({ username: "", email: "", firstName: "", lastName: "", enabled: true });
  const [roleForm,       setRoleForm]       = useState({ role: "" });
  const [changeRoleForm, setChangeRoleForm] = useState({ fromRole: "", toRole: "" });
  const [userRoles,      setUserRoles]      = useState([]);

  const PAGE_SIZE = 15;

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "ok") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  // ── Fetch users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await api.get(`${BASE}/users?first=${p * PAGE_SIZE}&max=${PAGE_SIZE}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Failed to load users", "err");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { fetchUsers(0); }, []); // eslint-disable-line

  // ── Search users ─────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const hasFilter = Object.values(searchFld).some(v => v.trim() !== "");
    if (!hasFilter) { fetchUsers(0); return; }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(searchFld).forEach(([k, v]) => v.trim() && params.append(k, v.trim()));
      params.append("first", "0");
      params.append("max", "50");
      const data = await api.get(`${BASE}/users/search?${params}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Search failed", "err");
    } finally {
      setLoading(false);
    }
  };

  // ── Create user ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.username || !createForm.email) {
      toast("Username and email are required", "err");
      return;
    }
    setBusy(true);
    try {
      // Backend returns the new userId string directly (not a response object)
      const newId = await api.post(`${BASE}/users`, createForm);
      toast(`User created — ID: ${newId}`);
      setModal(null);
      setCreateForm({ username: "", email: "", firstName: "", lastName: "", enabled: true });
      fetchUsers(0);
    } catch (e) {
      toast(e.message || "Create failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!activeUser) return;
    setBusy(true);
    try {
      // Backend returns 204 No Content — axios resolves with empty data, no .status check needed
      await api.delete(`${BASE}/users/${activeUser.id}`);
      toast(`User "${activeUser.username}" deleted`);
      setModal(null);
      setActiveUser(null);
      setUsers(prev => prev.filter(u => u.id !== activeUser.id));
    } catch (e) {
      toast(e.message || "Delete failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ── Assign role ───────────────────────────────────────────────────────────────
  // Body: { userId, role }  — NO "client" field (we use realm roles)
  const handleAssignRole = async () => {
    if (!roleForm.role) { toast("Select a role", "err"); return; }
    setBusy(true);
    try {
      await api.post(`${BASE}/assign-role`, {
        userId: activeUser.id,
        role:   roleForm.role,
        // ← no "client" field here — backend now uses realm roles only
      });
      toast(`Role "${roleForm.role}" assigned to ${activeUser.username}`);
      setModal(null);
      setRoleForm({ role: "" });
    } catch (e) {
      toast(e.message || "Assign failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ── Remove role ───────────────────────────────────────────────────────────────
  // Body: { userId, role }  — NO "client" field
  const handleRemoveRole = async (userId, roleName) => {
    setBusy(true);
    try {
      await api.delete(`${BASE}/remove-role`, {
        userId,
        role: roleName,
        // ← no "client" field
      });
      toast(`Role "${roleName}" removed`);
      loadUserRoles(userId);
    } catch (e) {
      toast(e.message || "Remove failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ── Change role ───────────────────────────────────────────────────────────────
  // Body: { userId, fromRole, toRole }  — NO fromClient / toClient fields
  const handleChangeRole = async () => {
    if (!changeRoleForm.fromRole || !changeRoleForm.toRole) {
      toast("Both roles are required", "err");
      return;
    }
    if (changeRoleForm.fromRole === changeRoleForm.toRole) {
      toast("fromRole and toRole must be different", "err");
      return;
    }
    setBusy(true);
    try {
      await api.patch(`${BASE}/change-role`, {
        userId:   activeUser.id,
        fromRole: changeRoleForm.fromRole,
        toRole:   changeRoleForm.toRole,
        // ← no fromClient / toClient
      });
      toast(`Role changed: ${changeRoleForm.fromRole} → ${changeRoleForm.toRole}`);
      setModal(null);
      setChangeRoleForm({ fromRole: "", toRole: "" });
    } catch (e) {
      toast(e.message || "Change failed", "err");
    } finally {
      setBusy(false);
    }
  };

  // ── View roles ─────────────────────────────────────────────────────────────
  // GET /auth/admin/users/{userId}/roles  — no ?client= param anymore
  const loadUserRoles = useCallback(async (userId) => {
    try {
      const data = await api.get(`${BASE}/users/${userId}/roles`);
      setUserRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Failed to load roles", "err");
    }
  }, [toast]);

  const openRolesView = async (user) => {
    setActiveUser(user);
    setModal("roles-view");
    await loadUserRoles(user.id);
  };

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.username  || "").toLowerCase().includes(q) ||
           (u.email     || "").toLowerCase().includes(q) ||
           (u.firstName || "").toLowerCase().includes(q) ||
           (u.lastName  || "").toLowerCase().includes(q);
  });

  const stats = {
    total:    users.length,
    enabled:  users.filter(u => u.enabled).length,
    disabled: users.filter(u => !u.enabled).length,
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="ad-root">
      <div className="ad-grid-bg" aria-hidden="true" />

      {/* Sidebar */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar__logo">
          <div className="ad-sidebar__logo-icon"><Icon.Lock /></div>
          <div>
            <p className="ad-sidebar__logo-name">Vendora</p>
            <p className="ad-sidebar__logo-sub">Auth Console</p>
          </div>
        </div>
        <nav className="ad-nav">
          <div className="ad-nav__item ad-nav__item--active"><Icon.Users /><span>Users</span></div>
          <div className="ad-nav__item"><Icon.Shield /><span>Roles</span></div>
          <div className="ad-nav__item"><Icon.Activity /><span>Audit Log</span></div>
        </nav>
        <div className="ad-sidebar__footer">
          <div className="ad-sidebar__admin">
            <div className="ad-sidebar__admin-dot" />
            <div>
              <p className="ad-sidebar__admin-name">Admin</p>
              <p className="ad-sidebar__admin-email">admin@vendora.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ad-main">
        <header className="ad-topbar">
          <div>
            <h1 className="ad-topbar__title">User Management</h1>
            <p className="ad-topbar__sub">Keycloak identity administration</p>
          </div>
          <div className="ad-topbar__actions">
            <button className="ad-btn ad-btn--ghost" onClick={() => fetchUsers(0)} title="Refresh">
              <Icon.Refresh />
            </button>
            <button className="ad-btn ad-btn--primary" onClick={() => setModal("create")}>
              <Icon.Plus /> New User
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="ad-stats">
          <StatCard icon={<Icon.Users />}  label="Total Users" value={stats.total}    accent="#0ea5e9" delay={0}    />
          <StatCard icon={<Icon.Check />}  label="Enabled"     value={stats.enabled}  accent="#10b981" delay={0.07} />
          <StatCard icon={<Icon.X />}      label="Disabled"    value={stats.disabled} accent="#ef4444" delay={0.14} />
          <StatCard icon={<Icon.Shield />} label="Realm"       value="vendora"        accent="#8b5cf6" delay={0.21} />
        </div>

        {/* Search bar */}
        <div className="ad-searchbar">
          <div className="ad-searchbar__quick">
            <span className="ad-searchbar__icon"><Icon.Search /></span>
            <input
              className="ad-searchbar__input"
              placeholder="Filter by name, email, username…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="ad-searchbar__clear" onClick={() => setSearch("")}><Icon.X /></button>
            )}
          </div>
          <details className="ad-advanced">
            <summary className="ad-advanced__toggle"><Icon.ChevronDown /> Advanced search</summary>
            <div className="ad-advanced__grid">
              {["username", "email", "firstName", "lastName"].map(f => (
                <input key={f} className="ad-input" placeholder={f}
                  value={searchFld[f]}
                  onChange={e => setSearchFld(p => ({ ...p, [f]: e.target.value }))} />
              ))}
              <button className="ad-btn ad-btn--primary ad-advanced__go" onClick={handleSearch}>
                <Icon.Search /> Search
              </button>
            </div>
          </details>
        </div>

        {/* Table */}
        <div className="ad-table-wrap">
          <div className="ad-table-head">
            <span>User</span><span>Email</span><span>Status</span><span>User ID</span><span>Actions</span>
          </div>

          <div className="ad-table-body">
            {loading && (
              <div className="ad-skeleton-list">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="ad-skeleton-row">
                    <div className="ad-skel-avatar"/>
                    <div className="ad-skel-lines">
                      <div className="ad-skel ad-skel--60"/><div className="ad-skel ad-skel--40"/>
                    </div>
                    <div className="ad-skel ad-skel--50" style={{ marginLeft:"auto" }}/>
                    <div className="ad-skel ad-skel--80"/>
                    <div className="ad-skel ad-skel--30"/>
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="ad-empty">
                <div className="ad-empty__icon"><Icon.Users /></div>
                <p className="ad-empty__title">No users found</p>
                <p className="ad-empty__sub">Try adjusting your search or create a new user.</p>
              </div>
            )}

            {!loading && filtered.map((u, i) => {
              const color = avatarColor(u.username || u.id);
              return (
                <div className="ad-row" key={u.id} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="ad-row__user">
                    <div className="ad-avatar" style={{ background: color + "22", color, borderColor: color + "44" }}>
                      {initials(u)}
                    </div>
                    <div className="ad-row__names">
                      <span className="ad-row__username">{u.username || "—"}</span>
                      <span className="ad-row__fullname">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                  </div>

                  <span className="ad-row__email">{u.email || "—"}</span>

                  <span className={`ad-badge ${u.enabled ? "ad-badge--on" : "ad-badge--off"}`}>
                    <span className="ad-badge__dot" />
                    {u.enabled ? "Enabled" : "Disabled"}
                  </span>

                  <span className="ad-row__id" title={u.id}>{u.id?.slice(0, 8)}…</span>

                  <div className="ad-row__actions">
                    <button className="ad-icon-btn" title="View roles"   onClick={() => openRolesView(u)}><Icon.Eye /></button>
                    <button className="ad-icon-btn" title="Assign role"  onClick={() => { setActiveUser(u); setModal("role"); }}><Icon.Key /></button>
                    <button className="ad-icon-btn" title="Change role"  onClick={() => { setActiveUser(u); setModal("change-role"); }}><Icon.Swap /></button>
                    <button className="ad-icon-btn ad-icon-btn--danger" title="Delete user" onClick={() => { setActiveUser(u); setModal("delete-confirm"); }}><Icon.Trash /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && (
            <div className="ad-pagination">
              <span className="ad-pagination__info">{filtered.length} users shown</span>
              <div className="ad-pagination__btns">
                <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={page === 0}
                  onClick={() => { setPage(p => p - 1); fetchUsers(page - 1); }}>← Prev</button>
                <span className="ad-pagination__page">Page {page + 1}</span>
                <button className="ad-btn ad-btn--ghost ad-btn--sm" disabled={users.length < PAGE_SIZE}
                  onClick={() => { setPage(p => p + 1); fetchUsers(page + 1); }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ════════ MODALS ════════ */}

      {/* Create user */}
      {modal === "create" && (
        <Modal title="Create New User" onClose={() => setModal(null)}>
          <div className="ad-form">
            <div className="ad-form__row">
              <Field label="Username *">
                <input className="ad-input" value={createForm.username}
                  onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} placeholder="john_doe" />
              </Field>
              <Field label="Email *">
                <input className="ad-input" type="email" value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
              </Field>
            </div>
            <div className="ad-form__row">
              <Field label="First Name">
                <input className="ad-input" value={createForm.firstName}
                  onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John" />
              </Field>
              <Field label="Last Name">
                <input className="ad-input" value={createForm.lastName}
                  onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
              </Field>
            </div>
            <Field label="Status">
              <div className="ad-toggle-row">
                <span>Enabled</span>
                <label className="ad-toggle">
                  <input type="checkbox" checked={createForm.enabled}
                    onChange={e => setCreateForm(p => ({ ...p, enabled: e.target.checked }))} />
                  <span className="ad-toggle__track"><span className="ad-toggle__thumb" /></span>
                </label>
              </div>
            </Field>
            <div className="ad-form__footer">
              <button className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn--primary" onClick={handleCreate} disabled={busy}>
                {busy ? <span className="ad-spinner" /> : <><Icon.Plus /> Create User</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign role — no client input, realm roles only */}
      {modal === "role" && activeUser && (
        <Modal title={`Assign Role — ${activeUser.username}`} onClose={() => setModal(null)}>
          <div className="ad-form">
            <Field label="Role">
              <input className="ad-input" value={roleForm.role}
                onChange={e => setRoleForm(p => ({ ...p, role: e.target.value.toUpperCase() }))}
                placeholder="PROVIDER / USER / ADMIN" />
            </Field>
            {/* Quick-pick pills for the three valid realm roles */}
            <div className="ad-role-pills">
              {REALM_ROLES.map(r => (
                <button key={r}
                  className={`ad-pill ${roleForm.role === r ? "ad-pill--active" : ""}`}
                  onClick={() => setRoleForm(p => ({ ...p, role: r }))}>
                  {r}
                </button>
              ))}
            </div>
            <div className="ad-form__footer">
              <button className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn--primary" onClick={handleAssignRole} disabled={busy}>
                {busy ? <span className="ad-spinner" /> : <><Icon.Key /> Assign Role</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change role — no client inputs, just fromRole and toRole */}
      {modal === "change-role" && activeUser && (
        <Modal title={`Change Role — ${activeUser.username}`} onClose={() => setModal(null)}>
          <div className="ad-form">
            <p className="ad-form__hint">Removes the old role and assigns the new one atomically.</p>

            <Field label="From Role">
              <div className="ad-role-pills" style={{ marginBottom: 0 }}>
                {REALM_ROLES.map(r => (
                  <button key={r}
                    className={`ad-pill ${changeRoleForm.fromRole === r ? "ad-pill--active" : ""}`}
                    onClick={() => setChangeRoleForm(p => ({ ...p, fromRole: r }))}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <div className="ad-change-arrow">↓ swap ↓</div>

            <Field label="To Role">
              <div className="ad-role-pills" style={{ marginBottom: 0 }}>
                {REALM_ROLES.map(r => (
                  <button key={r}
                    className={`ad-pill ${changeRoleForm.toRole === r ? "ad-pill--active" : ""}`}
                    onClick={() => setChangeRoleForm(p => ({ ...p, toRole: r }))}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <div className="ad-form__footer">
              <button className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn--primary" onClick={handleChangeRole} disabled={busy}>
                {busy ? <span className="ad-spinner" /> : <><Icon.Swap /> Change Role</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View roles — no client ID input, backend returns realm roles */}
      {modal === "roles-view" && activeUser && (
        <Modal title={`Roles — ${activeUser.username}`} onClose={() => setModal(null)}>
          <div className="ad-form">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="ad-btn ad-btn--ghost"
                onClick={() => loadUserRoles(activeUser.id)}>
                <Icon.Refresh /> Refresh
              </button>
            </div>

            {userRoles.length === 0 ? (
              <p className="ad-form__hint" style={{ textAlign: "center", padding: "24px 0" }}>
                No realm roles assigned to this user.
              </p>
            ) : (
              <div className="ad-roles-list">
                {userRoles.map(r => (
                  <div key={r.id || r.name} className="ad-role-row">
                    <div>
                      <p className="ad-role-row__name">{r.name}</p>
                      <p className="ad-role-row__id">{r.id}</p>
                    </div>
                    <button className="ad-icon-btn ad-icon-btn--danger" title="Remove role"
                      onClick={() => handleRemoveRole(activeUser.id, r.name)} disabled={busy}>
                      <Icon.Trash />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="ad-form__footer">
              <button className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal === "delete-confirm" && activeUser && (
        <Modal title="Confirm Delete" onClose={() => setModal(null)}>
          <div className="ad-form">
            <div className="ad-delete-warn">
              <div className="ad-delete-warn__icon"><Icon.Trash /></div>
              <p>You are about to permanently delete</p>
              <p className="ad-delete-warn__name">"{activeUser.username}"</p>
              <p className="ad-delete-warn__sub">This action cannot be undone. The user will be removed from Keycloak.</p>
            </div>
            <div className="ad-form__footer">
              <button className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn--danger" onClick={handleDelete} disabled={busy}>
                {busy ? <span className="ad-spinner" /> : <><Icon.Trash /> Delete User</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}