import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/chat.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/*
 * CUSTOMER CHAT PAGE
 *
 * Backend contract (updated):
 *  - WS endpoint uses SockJS  → useChatSocket handles this
 *  - CONNECT needs X-User-Id + X-User-Role headers
 *  - GET /message/conversations  (NO path var — uses X-User-Id header)
 *  - GET /message/{userId}/{providerId}  (requires X-User-Id header for auth)
 *  - WS response is MessageDTO: { id, clientId, senderId, receiverId, content, timestamp }
 *
 * ChatMessageDTO sent over WS:
 *  - clientId, userId (customer=me), providerId (provider=activeId),
 *    senderId (ignored by backend), receiverId, content
 */

/* ── helpers ─────────────────────────────────────────────── */
function getProfile() {
  try { return JSON.parse(localStorage.getItem("user_profile") || "{}"); }
  catch { return {}; }
}

// Build fetch headers — gateway needs X-User-Id to authorize /message endpoints
function authHeaders(userId) {
  return { "X-User-Id": userId, "Content-Type": "application/json" };
}

const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const fmtPreview = (ts) => {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const dateLabel = (ts) => {
  if (!ts) return null;
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ name, image, size = "conv" }) {
  const colors = ["#2D6A4F","#1B4332","#40916C","#276749","#1E5631"];
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";
  if (image) return <img src={image} className={`ch-av ch-av--${size}`} alt={name} />;
  return <div className={`ch-av ch-av--${size} ch-av--letter`} style={{ background: color }}>{initials}</div>;
}

/* ── Main ────────────────────────────────────────────────── */
export default function ChatPage() {
  const { userId: routeId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const profile = getProfile();
  const myId    = profile.id;
  const myRole  = "USER";                        // customer role for WS auth
  const myName  = profile.userName || "Me";

  const [activeId,    setActiveId]    = useState(routeId || null);
  const [activeName,  setActiveName]  = useState(location.state?.userName  || "");
  const [activeImage, setActiveImage] = useState(location.state?.userImage || null);

  const [convs,    setConvs]    = useState([]);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [convErr,  setConvErr]  = useState(null);
  const [msgErr,   setMsgErr]   = useState(null);


  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  
  const activeIdRef = useRef(activeId);

  // Synchronize state with URL param changes (back/forward or direct URL change)
  useEffect(() => {
    setActiveId(routeId || null);
    activeIdRef.current = routeId || null;
    // Clear name/image if it's a new ID we don't have state for
    if (routeId && routeId !== location.state?.userId) {
       setActiveName(location.state?.userName || "");
       setActiveImage(location.state?.userImage || null);
    }
  }, [routeId, location.state]);

  /* ── Fetch provider info when name is missing (page refresh / direct link) */
  useEffect(() => {
    if (!activeId || activeName || !myId) return;
    
    fetch(`http://localhost:8888/provider/${activeId}`, {
      headers: authHeaders(myId),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setActiveName(data.businessName || data.userName || activeId);
          setActiveImage(data.profilePhotoUrl || null);
        }
      })
      .catch(() => {}); 
  }, [activeId, activeName, myId]);

  /* ── Socket ──────────────────────────────────────────── */
  // WS delivers MessageDTO: { id, clientId, senderId, receiverId, content, timestamp }
  const { sendMessage, connected } = useChatSocket(myId, myRole, useCallback((msg) => {
    const peerId = msg.senderId === myId ? msg.receiverId : msg.senderId;

    if (peerId === activeIdRef.current || msg.senderId === myId) {
      setMessages(prev => {
        // replace optimistic bubble by matching clientId
        const idx = prev.findIndex(m => m._clientId && m._clientId === msg.clientId);
        if (idx !== -1) { const next = [...prev]; next[idx] = msg; return next; }
        // dedup by real id
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    // update sidebar last-message preview
    setConvs(prev => prev.map(c =>
      c.id === peerId || c.id === msg.senderId
        ? { ...c, lastMsg: msg.content, lastTs: msg.timestamp }
        : c
    ));
  }, [myId]));

  /* ── Load conversations ──────────────────────────────── */
  useEffect(() => {
    if (!myId) return;
    setConvErr(null);
    fetch("http://localhost:8888/message/conversations", {
      headers: authHeaders(myId),
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => setConvs(data.map(c => ({
        id:      c.peerId,
        name:    c.peerName  || c.peerId,
        image:   c.peerImage || null,
        lastMsg: c.lastMessage,
        lastTs:  c.lastTimestamp,
      }))))
      .catch(err => { console.error("Conversations:", err); setConvErr("Could not load conversations."); });
  }, [myId]);

  /* ── Load messages ───────────────────────────────────── */
  useEffect(() => {
    if (!myId || !activeId) return;
    setLoading(true); setMsgErr(null); setMessages([]);

    fetch(`http://localhost:8888/message/${myId}/${activeId}`, {
      headers: authHeaders(myId),
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(err => { console.error("Messages:", err); setMsgErr("Could not load messages."); })
      .finally(() => setLoading(false));
  }, [myId, activeId]);

  /* ── Auto scroll ─────────────────────────────────────── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* ── Send ────────────────────────────────────────────── */
  const handleSend = () => {
    if (!input.trim() || !activeId || !myId) return;
    const clientId = `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Optimistic bubble — uses _clientId (local only) so we can match the echo
    setMessages(prev => [...prev, {
      _clientId: clientId, senderId: myId, receiverId: activeId,
      content: input.trim(), timestamp: new Date().toISOString(),
    }]);

    // ChatMessageDTO: userId=customer(me), providerId=provider(activeId)
    // senderId is overwritten by backend from Principal, but we still send it
    sendMessage({
      clientId,
      userId:     myId,      // customer — room key
      providerId: activeId,  // provider — room key
      senderId:   myId,      // ignored by backend, overwritten from Principal
      receiverId: activeId,
      content:    input.trim(),
    });

    setInput(""); inputRef.current?.focus();
  };

  const openConv = (c) => {
    setActiveId(c.id); setActiveName(c.name); setActiveImage(c.image);
    navigate(`/chat/${c.id}`, { state: { userName: c.name, userImage: c.image } });
  };

  /* ── Group messages by date ──────────────────────────── */
  const grouped = [];
  let lastDate = null;
  messages.forEach((m, i) => {
    const label = dateLabel(m.timestamp);
    if (label && label !== lastDate) { grouped.push({ type: "divider", label, key: `d${i}` }); lastDate = label; }
    grouped.push({ type: "msg", m });
  });



  /* ── UI ──────────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <div className="ch-shell">

        {/* SIDEBAR */}
        <aside className="ch-sidebar">
          <div className="ch-sidebar__head">
            <div className="ch-sidebar__me">
              <Avatar name={myName} size="md" />
              <div className="ch-sidebar__me-info">
                <div className="ch-sidebar__me-name">{myName}</div>
                <div className="ch-sidebar__me-role">Customer</div>
              </div>
            </div>
            <div className={`ch-pill ch-pill--${connected ? "on" : "off"}`}>
              {connected ? "Online" : "Offline"}
            </div>
          </div>



          <div className="ch-conv-list">
            {convErr && <div style={{ color:"#EF4444", fontSize:12, textAlign:"center", padding:"16px 12px" }}>{convErr}</div>}
            {!convErr && convs.length === 0 && (
              <div className="ch-conv-empty">No conversations yet</div>
            )}
            {convs.map(c => (
              <div key={c.id} onClick={() => openConv(c)} className={`ch-conv${activeId === c.id ? " ch-conv--active" : ""}`}>
                <Avatar name={c.name} image={c.image} size="conv" />
                <div className="ch-conv__body">
                  <div className="ch-conv__top">
                    <div className="ch-conv__name">{c.name}</div>
                    <div className="ch-conv__time">{fmtPreview(c.lastTs)}</div>
                  </div>
                  <div className="ch-conv__preview">{c.lastMsg || "Start chatting"}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* PANEL */}
        <div className="ch-panel">
          {!activeId ? (
            <div className="ch-panel-empty">
              <div className="ch-panel-empty__icon">💬</div>
              <div className="ch-panel-empty__title">Select a conversation</div>
              <div className="ch-panel-empty__sub">Choose a provider to start chatting</div>
            </div>
          ) : (
            <>
              <div className="ch-panel-head">
                <Avatar name={activeName || activeId} image={activeImage} size="md" />
                <div className="ch-panel-head__info">
                  <div className="ch-panel-head__name">{activeName || activeId}</div>
                  <div className="ch-panel-head__status">
                    <span className={`ch-dot${connected ? " ch-dot--on" : ""}`} />
                    {connected ? "Online" : "Offline"}
                  </div>
                </div>
              </div>

              <div className="ch-messages">
                {loading  && <div className="ch-loading">Loading messages…</div>}
                {msgErr   && <div className="ch-msg-err">{msgErr}</div>}
                {!loading && !msgErr && messages.length === 0 && (
                  <div className="ch-no-messages">No messages yet. Say hello! 👋</div>
                )}
                {grouped.map((item, i) => {
                  if (item.type === "divider") return (
                    <div key={item.key} className="ch-date-div">
                      <div className="ch-date-div__line" />
                      <span className="ch-date-div__label">{item.label}</span>
                      <div className="ch-date-div__line" />
                    </div>
                  );
                  const { m } = item;
                  const isMine = m.senderId === myId;
                  return (
                    <div key={m.id || m._clientId || i} className={`ch-row ch-row--${isMine ? "mine" : "theirs"}`}>
                      <div className="ch-row__av-slot">
                        {!isMine && <Avatar name={activeName || activeId} image={activeImage} size="sm" />}
                      </div>
                      <div className={`ch-bwrap ch-bwrap--${isMine ? "mine" : "theirs"}`}>
                        <div className={`ch-bubble ch-bubble--${isMine ? "mine" : "theirs"}${m._clientId ? " ch-bubble--optimistic" : ""}`}>
                          {m.content}
                        </div>
                        <span className="ch-bubble__time">{fmtTime(m.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="ch-input-bar">
                <textarea
                  ref={inputRef} className="ch-textarea" value={input} rows={1}
                  onChange={e => setInput(e.target.value)} placeholder="Type a message…"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button className={`ch-send ch-send--${input.trim() ? "on" : "off"}`} onClick={handleSend} disabled={!input.trim()}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}