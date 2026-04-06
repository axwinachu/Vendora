import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/Chat.css";

/* ═══════════════════════════════════════════════════════════
   AUTH — reads from localStorage user_profile
═══════════════════════════════════════════════════════════ */
function getProfile() {
  try { return JSON.parse(localStorage.getItem("user_profile") || "{}"); }
  catch { return {}; }
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatPreviewTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())       return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function needsDateDivider(msgs, i) {
  if (i === 0) return true;
  return new Date(msgs[i - 1].timestamp).toDateString()
      !== new Date(msgs[i].timestamp).toDateString();
}

const AVATAR_COLORS = ["#2563EB","#10B981","#F59E0B","#8B5CF6","#EC4899","#0EA5E9","#F97316","#EF4444"];
function colorFor(s = "") { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */
function Avatar({ name = "?", src, size = "md" }) {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img className={`ch-avatar ch-avatar--${size}`} src={src} alt={name} onError={() => setErr(true)} />;
  return (
    <div className={`ch-avatar ch-avatar--${size} ch-avatar--letter`}
      style={{ background: colorFor(name) }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function DateDivider({ ts }) {
  return (
    <div className="ch-date-divider">
      <span className="ch-date-divider__line" />
      <span className="ch-date-divider__label">{formatDateLabel(ts)}</span>
      <span className="ch-date-divider__line" />
    </div>
  );
}

function Bubble({ msg, isMine, showAvatar, pName, pPhoto }) {
  return (
    <div className={`ch-msg-row ${isMine ? "ch-msg-row--mine" : "ch-msg-row--theirs"}`}>
      {!isMine && (
        <div className="ch-avatar-slot">
          {showAvatar && <Avatar name={pName} src={pPhoto} size="sm" />}
        </div>
      )}
      <div className={`ch-bubble-wrap ${isMine ? "ch-bubble-wrap--mine" : "ch-bubble-wrap--theirs"}`}>
        <div className={`ch-bubble ${isMine ? "ch-bubble--mine" : "ch-bubble--theirs"}`}>
          {msg.content}
        </div>
        <span className="ch-bubble-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="ch-typing">
      <span className="ch-typing__dot" /><span className="ch-typing__dot" /><span className="ch-typing__dot" />
    </div>
  );
}

function MsgSkeleton() {
  return (
    <div className="ch-skel-wrap">
      {[{w:"52%",r:false},{w:"38%",r:true},{w:"60%",r:false},{w:"44%",r:true},{w:"55%",r:false}]
        .map((s,i) => (
          <div key={i} className={`ch-skel-row ${s.r ? "ch-skel-row--right" : ""}`}>
            {!s.r && <div className="ch-skel-avatar" />}
            <div className="ch-skel-bubble" style={{ width: s.w }} />
          </div>
        ))}
    </div>
  );
}

function ConvItem({ conv, isActive, onClick }) {
  return (
    <button className={`ch-conv-item ${isActive ? "ch-conv-item--active" : ""}`} onClick={onClick}>
      <div className="ch-conv-item__avatar-wrap">
        <Avatar name={conv.name} src={conv.photo} size="conv" />
        {conv.online && <span className="ch-conv-item__online-dot" />}
      </div>
      <div className="ch-conv-item__info">
        <div className="ch-conv-item__top">
          <span className="ch-conv-item__name">{conv.name}</span>
          <span className="ch-conv-item__time">{formatPreviewTime(conv.lastTs)}</span>
        </div>
        <div className="ch-conv-item__bottom">
          <span className="ch-conv-item__preview">{conv.lastMsg || "Tap to chat"}</span>
          {conv.unread > 0 && (
            <span className="ch-conv-item__badge">{conv.unread > 99 ? "99+" : conv.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ icon, title, sub, action, actionLabel }) {
  return (
    <div className="ch-empty">
      <span className="ch-empty__icon">{icon}</span>
      <p className="ch-empty__title">{title}</p>
      {sub && <p className="ch-empty__sub">{sub}</p>}
      {action && <button className="ch-empty__btn" onClick={action}>{actionLabel}</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { providerId: routeProviderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Auth ── */
  const profile = getProfile();
  const myId    = profile.id;
  const myName  = profile.userName?.split("@")[0] || "Me";
  const myPhoto = profile.profilePhotoUrl;

  /* ── Active conversation ── */
  const [activeId,    setActiveId]    = useState(routeProviderId || null);
  const [activeName,  setActiveName]  = useState(location.state?.providerName  || "");
  const [activePhoto, setActivePhoto] = useState(location.state?.providerPhoto || null);

  /* ── Sidebar list ── */
  const [conversations, setConversations] = useState([]);
  const [convLoading,   setConvLoading]   = useState(true);

  /* ── Messages ── */
  const [messages,  setMessages]  = useState([]);
  const [msgLoad,   setMsgLoad]   = useState(false);
  const [msgError,  setMsgError]  = useState(false);

  /* ── UI ── */
  const [input,         setInput]         = useState("");
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [unread,        setUnread]        = useState(0);
  const [toast,         setToast]         = useState(null);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const panelRef   = useRef(null);
  const isAtBottom = useRef(true);

  /* ── WebSocket ── */
  const { sendMessage, connected } = useChatSocket(myId, (msg) => {
    const peerId = msg.senderId === myId ? msg.receiverId : msg.senderId;

    if (peerId === activeId || msg.senderId === activeId) {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        if (!isAtBottom.current) { setUnread(c => c + 1); setShowScrollFab(true); }
        return [...prev, msg];
      });
    }

    setConversations(prev => prev.map(c => {
      if (c.id !== peerId) return c;
      return { ...c, lastMsg: msg.content, lastTs: msg.timestamp,
        unread: c.id === activeId ? 0 : (c.unread || 0) + 1 };
    }));
  });

  /* ── Init conversation list ── */
  useEffect(() => {
    if (!myId) return;
    try {
      const cached = JSON.parse(localStorage.getItem(`ch_convs_${myId}`) || "[]");
      if (cached.length) setConversations(cached);
    } catch {}

    const navName  = location.state?.providerName;
    const navPhoto = location.state?.providerPhoto;
    if (routeProviderId && navName) {
      setConversations(prev => {
        if (prev.some(c => c.id === routeProviderId)) return prev;
        const updated = [
          { id: routeProviderId, name: navName, photo: navPhoto || null,
            lastMsg: "", lastTs: null, unread: 0, online: false },
          ...prev,
        ];
        localStorage.setItem(`ch_convs_${myId}`, JSON.stringify(updated));
        return updated;
      });
    }
    setConvLoading(false);
  }, [myId]);

  /* ── Load messages on active change ── */
  useEffect(() => {
    if (!myId || !activeId) return;
    setMsgLoad(true); setMsgError(false); setMessages([]);
    setUnread(0); setShowScrollFab(false);
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));

    fetch(`http://localhost:8087/message/${myId}/${activeId}`, { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setMessages(list);
        if (list.length) {
          const last = list[list.length - 1];
          setConversations(prev => prev.map(c =>
            c.id === activeId ? { ...c, lastMsg: last.content, lastTs: last.timestamp } : c
          ));
        }
      })
      .catch(err => { console.error("History failed:", err.message); setMsgError(true); })
      .finally(() => setMsgLoad(false));
  }, [myId, activeId]);

  /* ── Sync URL ── */
  useEffect(() => {
    if (activeId) navigate(`/chat/${activeId}`, {
      replace: true,
      state: { providerName: activeName, providerPhoto: activePhoto }
    });
  }, [activeId]);

  /* ── Auto scroll ── */
  useEffect(() => {
    if (isAtBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePanelScroll = useCallback(() => {
    const el = panelRef.current; if (!el) return;
    const atBot = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottom.current = atBot;
    if (atBot) { setShowScrollFab(false); setUnread(0); }
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollFab(false); setUnread(0);
  };

  const selectConv = (conv) => {
    setActiveId(conv.id);
    setActiveName(conv.name);
    setActivePhoto(conv.photo);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  /* ── Send ── */
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (!connected) { showToast("Reconnecting… please wait"); return; }
    if (!myId)      { showToast("Please log in again"); return; }
    if (!activeId)  { showToast("Select a conversation first"); return; }

    sendMessage({ userId: myId, providerId: activeId, senderId: myId, receiverId: activeId, content: input.trim() });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  }, [input, connected, myId, activeId, sendMessage]);

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextarea = e => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const grouped = messages.map((msg, i) => ({
    msg, isMine: msg.senderId === myId,
    showAvatar: !messages[i - 1] || messages[i - 1].senderId !== msg.senderId,
    showDate: needsDateDivider(messages, i),
  }));

  const canSend = connected && !!input.trim() && !!activeId;

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="ch-shell">

      {/* ════ LEFT SIDEBAR ════ */}
      <aside className="ch-sidebar">
        <div className="ch-sidebar__header">
          <div className="ch-sidebar__me">
            <Avatar name={myName} src={myPhoto} size="sm" />
            <span className="ch-sidebar__me-name">{myName}</span>
          </div>
          <span className={`ch-ws-pill ${connected ? "ch-ws-pill--on" : "ch-ws-pill--off"}`}>
            {connected ? "Live" : "…"}
          </span>
        </div>

        <p className="ch-sidebar__label">Messages</p>

        <div className="ch-conv-list">
          {convLoading && (
            <div className="ch-conv-skel">
              {[1,2,3].map(i => (
                <div key={i} className="ch-conv-skel__item">
                  <div className="ch-conv-skel__avatar" />
                  <div className="ch-conv-skel__lines">
                    <div className="ch-conv-skel__line ch-conv-skel__line--60" />
                    <div className="ch-conv-skel__line ch-conv-skel__line--40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!convLoading && conversations.length === 0 && (
            <div className="ch-conv-empty">
              <span>💬</span>
              <p>No conversations yet</p>
              <small>Chat with a provider to start</small>
            </div>
          )}

          {!convLoading && conversations.map(conv => (
            <ConvItem key={conv.id} conv={conv}
              isActive={conv.id === activeId} onClick={() => selectConv(conv)} />
          ))}
        </div>
      </aside>

      {/* ════ RIGHT PANEL ════ */}
      <div className="ch-panel">

        {!activeId && (
          <div className="ch-panel-empty">
            <span className="ch-panel-empty__icon">💬</span>
            <p className="ch-panel-empty__title">Select a conversation</p>
            <p className="ch-panel-empty__sub">Pick a provider from the left to start chatting</p>
          </div>
        )}

        {activeId && (
          <>
            {/* Header */}
            <div className="ch-panel-header">
              <button className="ch-back-btn" onClick={() => navigate(-1)}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <Avatar name={activeName || "Provider"} src={activePhoto} size="md" />
              <div className="ch-panel-header__info">
                <span className="ch-panel-header__name">{activeName || "Provider"}</span>
                <span className="ch-panel-header__status">
                  <span className={`ch-status-dot ${connected ? "ch-status-dot--on" : "ch-status-dot--off"}`} />
                  {connected ? "Online" : "Connecting…"}
                </span>
              </div>
            </div>

            {!connected && (
              <div className="ch-offline-banner">
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55"/>
                </svg>
                Reconnecting to chat…
              </div>
            )}

            {/* Messages */}
            <div className="ch-messages" ref={panelRef} onScroll={handlePanelScroll}>
              {msgLoad && <MsgSkeleton />}
              {msgError && !msgLoad && (
                <EmptyState icon="⚠️" title="Couldn't load messages" sub="Check your connection."
                  action={() => window.location.reload()} actionLabel="Retry" />
              )}
              {!msgLoad && !msgError && messages.length === 0 && (
                <EmptyState icon="👋" title={`Say hello to ${activeName || "the provider"}!`}
                  sub="Your messages will appear here." />
              )}
              {!msgLoad && grouped.map(({ msg, isMine, showAvatar, showDate }, i) => (
                <div key={msg.id ?? i}>
                  {showDate && <DateDivider ts={msg.timestamp} />}
                  <Bubble msg={msg} isMine={isMine} showAvatar={showAvatar}
                    pName={activeName} pPhoto={activePhoto} />
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Scroll FAB */}
            {showScrollFab && (
              <button className="ch-scroll-fab" onClick={scrollToBottom}>
                {unread > 0 && <span className="ch-scroll-fab__badge">{unread > 99 ? "99+" : unread}</span>}
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            )}

            {toast && <div className="ch-toast">{toast}</div>}

            {/* Input bar */}
            <div className="ch-input-bar">
              <div className="ch-input-wrap">
                <textarea ref={inputRef} className="ch-textarea" value={input}
                  onChange={handleTextarea} onKeyDown={handleKeyDown}
                  placeholder="Type a message…" rows={1} disabled={!myId} />
              </div>
              <button className={`ch-send-btn ${canSend ? "ch-send-btn--active" : "ch-send-btn--inactive"}`}
                onClick={handleSend} disabled={!canSend}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}