import { useState, useEffect, useCallback, useRef } from "react";
import API from "../axios/api";
import "../styles/Provider.css";

// ── Enums ────────────────────────────────────────────────────────────────────
const DISTRICTS  = ["COIMBATORE", "PALAKKAD"];
const STATUSES   = ["PENDING", "APPROVED", "SUSPEND", "REJECTED"];
const CATEGORIES = [
  "ELECTRICAL","MECHANICAL","DIGITAL_MARKETING","IT_SERVICES",
  "PHOTOGRAPHY","SALE_MARKETING","TUTORING","ELECTRICIAN",
  "PLUMBER","AC_REPAIR","HOUSE_CLEANING","OTHERS",
];

// ── API helpers ───────────────────────────────────────────────────────────────
const pApi = {
  getAll:        ()        => API.get("/provider/all").then(r => r.data),
  getById:       (id)      => API.get(`/provider/${id}`).then(r => r.data),
  getByDistrict: (d)       => API.get(`/provider/district/${d}`).then(r => r.data),
  getByCategory: (c)       => API.get(`/provider/category/${c}`).then(r => r.data),
  create:        (body)    => API.post("/provider/create", body).then(r => r.data),
  update:        (id, body)=> API.put(`/provider/${id}`, body).then(r => r.data),
  setStatus:     (id, s)   => API.patch(`/provider/${id}/status?status=${s}`).then(r => r.data),
  toggleAvail:   (id)      => API.patch(`/provider/${id}/availability`).then(r => r.data),
  deleteP:       (id)      => API.delete(`/provider/${id}`),
  uploadPhoto:   (id, file) => {
    const fd = new FormData(); fd.append("file", file);
    return API.post(`/provider/${id}/photo`, fd, { headers:{"Content-Type":"multipart/form-data"} }).then(r => r.data);
  },
  removePhoto:      (id)        => API.delete(`/provider/${id}/photo`).then(r => r.data),
  uploadPortfolio:  (id, file)  => {
    const fd = new FormData(); fd.append("file", file);
    return API.post(`/provider/${id}/portfolio`, fd, { headers:{"Content-Type":"multipart/form-data"} }).then(r => r.data);
  },
  removePortfolio:  (id, url)   =>
    API.delete(`/provider/${id}/portfolio?imageUrl=${encodeURIComponent(url)}`).then(r => r.data),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "??";
const fmt      = (iso) => iso
  ? new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtPrice = (p,unit) => p!=null ? `₹${p}${unit?` / ${unit}`:""}` : "—";
const fmtCat   = (c) => c ? c.replace(/_/g," ") : "—";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  Briefcase: ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  Search:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Star:      ()=><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  MapPin:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Close:     ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh:   ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Check:     ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:     ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Camera:    ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Image:     ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Plus:      ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Zap:       ()=><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Eye:       ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Grid:      ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List:      ()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

const STATUS_META = {
  PENDING:  { cls:"pm-s-pending",  label:"Pending"   },
  APPROVED: { cls:"pm-s-approved", label:"Approved"  },
  SUSPEND:  { cls:"pm-s-suspend",  label:"Suspended" },
  REJECTED: { cls:"pm-s-rejected", label:"Rejected"  },
};

// ── Small components ──────────────────────────────────────────────────────────
function Avatar({ provider, size="md" }) {
  const [err, setErr] = useState(false);
  if (provider.profilePhotoUrl && !err)
    return <img className={`pm-avatar pm-avatar--${size}`} src={provider.profilePhotoUrl} alt={provider.businessName} onError={()=>setErr(true)} />;
  return <div className={`pm-avatar-fallback pm-avatar--${size}`}>{initials(provider.businessName||provider.email)}</div>;
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || {cls:"",label:status};
  return <span className={`pm-badge ${m.cls}`}>{m.label}</span>;
}

function Stars({ rating }) {
  return <span className="pm-stars"><Ic.Star /><span>{(rating||0).toFixed(1)}</span></span>;
}

function Field({ label, children, wide }) {
  return (
    <label className={`pm-field${wide?" pm-field--wide":""}`}>
      <span>{label}</span>{children}
    </label>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="pm-info-row">
      <span className="pm-info-label">{label}</span>
      <span className="pm-info-val">{children}</span>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="pm-confirm-wrap" onClick={onCancel}>
      <div className="pm-confirm" onClick={e=>e.stopPropagation()}>
        <p>{message}</p>
        <div className="pm-confirm-actions">
          <button className="pm-btn pm-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="pm-btn pm-btn--danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const blank = { userId:"",businessName:"",description:"",serviceCategory:"",district:"",address:"",latitude:"",longitude:"",experienceYears:"",basePrice:"",priceUnit:"" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr]   = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        ...form,
        latitude:        form.latitude        ? +form.latitude        : undefined,
        longitude:       form.longitude       ? +form.longitude       : undefined,
        experienceYears: form.experienceYears ? +form.experienceYears : undefined,
        basePrice:       form.basePrice       ? +form.basePrice       : undefined,
        serviceCategory: form.serviceCategory || undefined,
        district:        form.district        || undefined,
      };
      const p = await pApi.create(body);
      onCreated(p); onClose();
    } catch { setErr("Creation failed. Check required fields."); }
    finally { setSaving(false); }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e=>e.stopPropagation()}>
        <div className="pm-modal-head">
          <h2>New Provider</h2>
          <button className="pm-icon-btn" onClick={onClose}><Ic.Close /></button>
        </div>
        {err && <div className="pm-err-bar">{err}</div>}
        <div className="pm-modal-grid">
          <Field label="User ID *"><input value={form.userId} onChange={e=>set("userId",e.target.value)} /></Field>
          <Field label="Business Name *"><input value={form.businessName} onChange={e=>set("businessName",e.target.value)} /></Field>
          <Field label="Category *">
            <select value={form.serviceCategory} onChange={e=>set("serviceCategory",e.target.value)}>
              <option value="">— select —</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{fmtCat(c)}</option>)}
            </select>
          </Field>
          <Field label="District *">
            <select value={form.district} onChange={e=>set("district",e.target.value)}>
              <option value="">— select —</option>
              {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Address *" wide><input value={form.address} onChange={e=>set("address",e.target.value)} /></Field>
          <Field label="Latitude"><input type="number" value={form.latitude} onChange={e=>set("latitude",e.target.value)} /></Field>
          <Field label="Longitude"><input type="number" value={form.longitude} onChange={e=>set("longitude",e.target.value)} /></Field>
          <Field label="Exp. Years"><input type="number" value={form.experienceYears} onChange={e=>set("experienceYears",e.target.value)} /></Field>
          <Field label="Base Price (₹)"><input type="number" value={form.basePrice} onChange={e=>set("basePrice",e.target.value)} /></Field>
          <Field label="Price Unit"><input value={form.priceUnit} placeholder="hr / visit…" onChange={e=>set("priceUnit",e.target.value)} /></Field>
          <Field label="Description" wide><textarea rows={3} value={form.description} onChange={e=>set("description",e.target.value)} /></Field>
        </div>
        <div className="pm-modal-foot">
          <button className="pm-btn pm-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="pm-btn pm-btn--primary" onClick={submit} disabled={saving}>
            {saving ? <span className="pm-spinner pm-spinner--sm"/> : <><Ic.Plus /> Create</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider Drawer ───────────────────────────────────────────────────────────
function ProviderDrawer({ providerId, onClose, onUpdated, onDeleted }) {
  const [p, setP]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("info");
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [confirm, setConfirm] = useState(false);
  const photoRef              = useRef();
  const portRef               = useRef();

  const load = useCallback(() => {
    setLoading(true);
    pApi.getById(providerId)
      .then(data=>{ setP(data); setForm({...data}); })
      .catch(()=>setErr("Failed to load provider."))
      .finally(()=>setLoading(false));
  }, [providerId]);

  useEffect(()=>{ load(); },[load]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const saveEdit = async () => {
    setSaving(true); setErr("");
    try {
      const u = await pApi.update(providerId, {
        businessName:    form.businessName    || undefined,
        description:     form.description     || undefined,
        serviceCategory: form.serviceCategory || undefined,
        district:        form.district        || undefined,
        address:         form.address         || undefined,
        latitude:        form.latitude  != null ? +form.latitude  : undefined,
        longitude:       form.longitude != null ? +form.longitude : undefined,
        experienceYears: form.experienceYears  != null ? +form.experienceYears : undefined,
        basePrice:       form.basePrice        != null ? +form.basePrice       : undefined,
        priceUnit:       form.priceUnit        || undefined,
        isAvailable:     form.isAvailable,
      });
      setP(u); setForm({...u}); onUpdated(u); setTab("info");
    } catch { setErr("Update failed."); }
    finally { setSaving(false); }
  };

  const changeStatus = async (status) => {
    try { const u = await pApi.setStatus(providerId, status); setP(u); onUpdated(u); }
    catch { setErr("Status change failed."); }
  };

  const toggle = async () => {
    try { const u = await pApi.toggleAvail(providerId); setP(u); onUpdated(u); }
    catch { setErr("Toggle failed."); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const u = await pApi.uploadPhoto(providerId, file); setP(u); onUpdated(u); }
    catch { setErr("Photo upload failed."); }
    e.target.value = "";
  };

  const handlePortfolio = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const u = await pApi.uploadPortfolio(providerId, file); setP(u); onUpdated(u); }
    catch { setErr("Portfolio upload failed."); }
    e.target.value = "";
  };

  const removePort = async (url) => {
    try { const u = await pApi.removePortfolio(providerId, url); setP(u); onUpdated(u); }
    catch { setErr("Remove failed."); }
  };

  const handleDelete = async () => {
    try { await pApi.deleteP(providerId); onDeleted(providerId); onClose(); }
    catch { setErr("Delete failed."); setConfirm(false); }
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <aside className="pm-drawer" onClick={e=>e.stopPropagation()}>
        <button className="pm-icon-btn pm-drawer-close" onClick={onClose}><Ic.Close /></button>

        {loading && <div className="pm-drawer-loader"><div className="pm-spinner"/></div>}
        {!loading && !p && <div className="pm-err-bar">{err||"Not found."}</div>}

        {p && (
          <>
            {/* Hero */}
            <div className="pm-drawer-hero">
              <div className="pm-drawer-avatar-wrap">
                <Avatar provider={p} size="lg"/>
                <button className="pm-cam-btn" onClick={()=>photoRef.current.click()} title="Change photo">
                  <Ic.Camera/>
                </button>
                <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
              </div>
              <div className="pm-drawer-bio">
                <h2>{p.businessName||"—"}</h2>
                <p className="pm-muted">{p.email||p.userId}</p>
                <div className="pm-drawer-bio-badges">
                  <StatusBadge status={p.status}/>
                  <span className={`pm-avail-chip ${p.isAvailable?"on":"off"}`}>
                    {p.isAvailable?"● Live":"○ Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="pm-quick-row">
              <button className={`pm-quick-btn ${p.isAvailable?"pm-quick-btn--on":""}`} onClick={toggle}>
                <Ic.Zap/>{p.isAvailable?"Go Offline":"Go Live"}
              </button>
              <button className="pm-quick-btn pm-quick-btn--del" onClick={()=>setConfirm(true)}>
                <Ic.Trash/>Delete
              </button>
            </div>

            {/* Status pills */}
            <div className="pm-status-section">
              <span className="pm-section-label">Set Status</span>
              <div className="pm-status-pills">
                {STATUSES.map(s=>(
                  <button
                    key={s}
                    className={`pm-spill pm-s-${s.toLowerCase()}${p.status===s?" selected":""}`}
                    onClick={()=>changeStatus(s)}
                  >{STATUS_META[s]?.label||s}</button>
                ))}
              </div>
            </div>

            {err && <div className="pm-err-bar">{err}</div>}

            {/* Tabs */}
            <div className="pm-tabs">
              {["info","edit","media"].map(t=>(
                <button key={t} className={`pm-tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {tab==="info" && (
              <div className="pm-tab-body">
                <InfoRow label="Category">{fmtCat(p.serviceCategory)}</InfoRow>
                <InfoRow label="District">{p.district||"—"}</InfoRow>
                <InfoRow label="Address"><span className="pm-wrap">{p.address||"—"}</span></InfoRow>
                <InfoRow label="Experience">{p.experienceYears!=null?`${p.experienceYears} yrs`:"—"}</InfoRow>
                <InfoRow label="Price">{fmtPrice(p.basePrice,p.priceUnit)}</InfoRow>
                <InfoRow label="Rating"><Stars rating={p.averageRating}/> <span className="pm-muted">({p.totalReviews||0} reviews)</span></InfoRow>
                <InfoRow label="Bookings">{p.totalBookings??0}</InfoRow>
                <InfoRow label="Coordinates">{p.latitude?`${p.latitude?.toFixed(5)}, ${p.longitude?.toFixed(5)}`:"—"}</InfoRow>
                <InfoRow label="Joined">{fmt(p.createdAt)}</InfoRow>
                <InfoRow label="Updated">{fmt(p.updatedAt)}</InfoRow>
                {p.description&&(
                  <div className="pm-desc-block">
                    <span className="pm-section-label">Description</span>
                    <p>{p.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Edit */}
            {tab==="edit" && (
              <div className="pm-tab-body">
                <div className="pm-edit-grid">
                  <Field label="Business Name"><input value={form.businessName||""} onChange={e=>set("businessName",e.target.value)}/></Field>
                  <Field label="Category">
                    <select value={form.serviceCategory||""} onChange={e=>set("serviceCategory",e.target.value)}>
                      <option value="">— select —</option>
                      {CATEGORIES.map(c=><option key={c} value={c}>{fmtCat(c)}</option>)}
                    </select>
                  </Field>
                  <Field label="District">
                    <select value={form.district||""} onChange={e=>set("district",e.target.value)}>
                      <option value="">— select —</option>
                      {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Exp. Years"><input type="number" value={form.experienceYears??""} onChange={e=>set("experienceYears",e.target.value)}/></Field>
                  <Field label="Base Price ₹"><input type="number" value={form.basePrice??""} onChange={e=>set("basePrice",e.target.value)}/></Field>
                  <Field label="Price Unit"><input value={form.priceUnit||""} onChange={e=>set("priceUnit",e.target.value)}/></Field>
                  <Field label="Latitude"><input type="number" value={form.latitude??""} onChange={e=>set("latitude",e.target.value)}/></Field>
                  <Field label="Longitude"><input type="number" value={form.longitude??""} onChange={e=>set("longitude",e.target.value)}/></Field>
                  <Field label="Address" wide><input value={form.address||""} onChange={e=>set("address",e.target.value)}/></Field>
                  <Field label="Description" wide><textarea rows={3} value={form.description||""} onChange={e=>set("description",e.target.value)}/></Field>
                </div>
                <div className="pm-edit-foot">
                  <button className="pm-btn pm-btn--ghost" onClick={()=>setTab("info")}>Cancel</button>
                  <button className="pm-btn pm-btn--primary" onClick={saveEdit} disabled={saving}>
                    {saving?<span className="pm-spinner pm-spinner--sm"/>:<><Ic.Check/>Save Changes</>}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Media */}
            {tab==="media" && (
              <div className="pm-tab-body">
                <div className="pm-media-block">
                  <div className="pm-media-block-head">
                    <span className="pm-section-label">Profile Photo</span>
                    <button className="pm-btn pm-btn--sm pm-btn--ghost" onClick={()=>photoRef.current.click()}>
                      <Ic.Camera/>Upload
                    </button>
                  </div>
                  {p.profilePhotoUrl
                    ? <img className="pm-profile-preview" src={p.profilePhotoUrl} alt="profile"/>
                    : <div className="pm-no-media">No photo uploaded yet</div>}
                </div>

                <div className="pm-media-block">
                  <div className="pm-media-block-head">
                    <span className="pm-section-label">Portfolio ({(p.portfolioImages||[]).length}/10)</span>
                    <button className="pm-btn pm-btn--sm pm-btn--ghost" onClick={()=>portRef.current.click()}>
                      <Ic.Image/>Add
                    </button>
                    <input ref={portRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePortfolio}/>
                  </div>
                  {(!p.portfolioImages||p.portfolioImages.length===0)
                    ? <div className="pm-no-media">No portfolio images</div>
                    : <div className="pm-portfolio-grid">
                        {p.portfolioImages.map((url,i)=>(
                          <div key={i} className="pm-port-item">
                            <img src={url} alt={`p-${i}`}/>
                            <button className="pm-port-del" onClick={()=>removePort(url)}><Ic.Trash/></button>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      {confirm && (
        <ConfirmDialog
          message={`Permanently delete "${p?.businessName}"? All photos will be removed.`}
          onConfirm={handleDelete}
          onCancel={()=>setConfirm(false)}
        />
      )}
    </div>
  );
}

// ── Provider Card ─────────────────────────────────────────────────────────────
function ProviderCard({ provider, onClick }) {
  return (
    <div className="pm-card" onClick={onClick}>
      <div className="pm-card-header">
        <Avatar provider={provider} size="md"/>
        <div className="pm-card-header-right">
          <StatusBadge status={provider.status}/>
          {provider.isAvailable&&<span className="pm-avail-chip on sm">Live</span>}
        </div>
      </div>
      <h3 className="pm-card-name">{provider.businessName||"—"}</h3>
      <p className="pm-card-cat">{fmtCat(provider.serviceCategory)}</p>
      <div className="pm-card-meta">
        <span><Ic.MapPin/>{provider.district||"—"}</span>
        <span><Stars rating={provider.averageRating}/></span>
      </div>
      <div className="pm-card-foot">
        <span className="pm-card-price">{fmtPrice(provider.basePrice,provider.priceUnit)}</span>
        {provider.experienceYears!=null&&<span className="pm-muted">{provider.experienceYears}y exp</span>}
      </div>
      <div className="pm-card-hover-overlay"><Ic.Eye/> View</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Provider() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [distFilter, setDistFilter] = useState("ALL");
  const [catFilter, setCatFilter]   = useState("ALL");
  const [statFilter, setStatFilter] = useState("ALL");
  const [viewMode, setViewMode]     = useState("grid");
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const stats = {
    total:    providers.length,
    approved: providers.filter(p=>p.status==="APPROVED").length,
    pending:  providers.filter(p=>p.status==="PENDING").length,
    live:     providers.filter(p=>p.isAvailable).length,
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      let data;
      if (distFilter!=="ALL"&&catFilter!=="ALL")
        data = await API.get(`/provider/district/${distFilter}/category/${catFilter}`).then(r=>r.data);
      else if (distFilter!=="ALL") data = await pApi.getByDistrict(distFilter);
      else if (catFilter!=="ALL")  data = await pApi.getByCategory(catFilter);
      else                          data = await pApi.getAll();
      setProviders(data);
    } catch { setError("Could not load providers."); }
    finally { setLoading(false); }
  }, [distFilter, catFilter]);

  useEffect(()=>{ load(); },[load]);

  const visible = providers.filter(p => {
    const q = search.toLowerCase();
    return (
      (!q || p.businessName?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)) &&
      (statFilter==="ALL" || p.status===statFilter)
    );
  });

  const onUpdated = (u) => setProviders(prev=>prev.map(p=>p.userId===u.userId?u:p));
  const onDeleted = (id) => setProviders(prev=>prev.filter(p=>p.userId!==id));
  const onCreated = (p)  => setProviders(prev=>[p,...prev]);

  return (
    <div className="pm-root">
      {/* Top bar */}
      <header className="pm-topbar">
        <div className="pm-topbar-left">
          <div className="pm-topbar-icon"><Ic.Briefcase/></div>
          <div>
            <h1 className="pm-topbar-title">Provider Management</h1>
            <p className="pm-topbar-sub">Vendora Admin Console</p>
          </div>
        </div>
        <div className="pm-topbar-right">
          <button className="pm-icon-btn" onClick={load} title="Refresh"><Ic.Refresh/></button>
          <button className="pm-btn pm-btn--primary" onClick={()=>setShowCreate(true)}>
            <Ic.Plus/>New Provider
          </button>
        </div>
      </header>

      <div className="pm-body">
        {/* Stats */}
        <div className="pm-stats">
          {[
            {label:"Total Providers", val:stats.total,    mod:""},
            {label:"Approved",        val:stats.approved, mod:"green"},
            {label:"Pending Review",  val:stats.pending,  mod:"amber"},
            {label:"Live Now",        val:stats.live,     mod:"teal"},
          ].map(s=>(
            <div key={s.label} className={`pm-stat-card ${s.mod?`pm-stat-card--${s.mod}`:""}`}>
              <span className="pm-stat-val">{s.val}</span>
              <span className="pm-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="pm-toolbar">
          <div className="pm-search">
            <span className="pm-search-icon"><Ic.Search/></span>
            <input
              placeholder="Search name, email, address…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
            {search&&<button className="pm-search-clear" onClick={()=>setSearch("")}><Ic.Close/></button>}
          </div>
          <div className="pm-toolbar-filters">
            <span className="pm-filter-ico"><Ic.Filter/></span>
            <select className="pm-select" value={distFilter} onChange={e=>setDistFilter(e.target.value)}>
              <option value="ALL">All Districts</option>
              {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select className="pm-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{fmtCat(c)}</option>)}
            </select>
            <select className="pm-select" value={statFilter} onChange={e=>setStatFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s=><option key={s} value={s}>{STATUS_META[s]?.label||s}</option>)}
            </select>
            <div className="pm-view-toggle">
              <button className={viewMode==="grid"?"active":""} onClick={()=>setViewMode("grid")} title="Grid"><Ic.Grid/></button>
              <button className={viewMode==="table"?"active":""} onClick={()=>setViewMode("table")} title="Table"><Ic.List/></button>
            </div>
          </div>
        </div>

        {error&&<div className="pm-err-bar pm-err-bar--page">{error}</div>}

        {/* Skeleton */}
        {loading&&(
          <div className="pm-skeleton-grid">
            {[...Array(6)].map((_,i)=><div key={i} className="pm-skeleton"/>)}
          </div>
        )}

        {/* Grid */}
        {!loading&&viewMode==="grid"&&(
          <>
            {visible.length===0
              ? <p className="pm-empty">No providers match your filters.</p>
              : <div className="pm-grid">{visible.map(p=><ProviderCard key={p.userId} provider={p} onClick={()=>setSelectedId(p.userId)}/>)}</div>
            }
            <p className="pm-count">Showing <strong>{visible.length}</strong> of <strong>{providers.length}</strong> providers</p>
          </>
        )}

        {/* Table */}
        {!loading&&viewMode==="table"&&(
          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Provider</th><th>Category</th><th>District</th>
                  <th>Price</th><th>Rating</th><th>Status</th>
                  <th>Available</th><th>Joined</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.length===0&&<tr><td colSpan={9} className="pm-empty">No providers match your filters.</td></tr>}
                {visible.map(p=>(
                  <tr key={p.userId} className="pm-tr" onClick={()=>setSelectedId(p.userId)}>
                    <td>
                      <div className="pm-table-cell">
                        <div className="pm-table-av"><Avatar provider={p} size="sm"/></div>
                        <div>
                          <div className="pm-table-name">{p.businessName||"—"}</div>
                          <div className="pm-muted">{p.email||p.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="pm-muted">{fmtCat(p.serviceCategory)}</td>
                    <td className="pm-muted">{p.district||"—"}</td>
                    <td className="pm-muted">{fmtPrice(p.basePrice,p.priceUnit)}</td>
                    <td><Stars rating={p.averageRating}/></td>
                    <td><StatusBadge status={p.status}/></td>
                    <td><span className={`pm-avail-chip ${p.isAvailable?"on":"off"} sm`}>{p.isAvailable?"Yes":"No"}</span></td>
                    <td className="pm-muted">{fmt(p.createdAt)}</td>
                    <td><button className="pm-icon-btn" onClick={e=>{e.stopPropagation();setSelectedId(p.userId);}}><Ic.Eye/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pm-count">Showing <strong>{visible.length}</strong> of <strong>{providers.length}</strong> providers</p>
          </div>
        )}
      </div>

      {selectedId&&(
        <ProviderDrawer
          providerId={selectedId}
          onClose={()=>setSelectedId(null)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}

      {showCreate&&(
        <CreateModal onClose={()=>setShowCreate(false)} onCreated={onCreated}/>
      )}
    </div>
  );
}