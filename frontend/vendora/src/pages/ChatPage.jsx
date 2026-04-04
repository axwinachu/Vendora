import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/Chat.css";

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem("user_profile") || "{}");
  } catch {
    return {};
  }
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function shouldShowDateDivider(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].timestamp);
  const curr = new Date(messages[index].timestamp);
  return prev.toDateString() !== curr.toDateString();
}

const AVATAR_COLORS = ["#2563EB","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9","#F97316"];
function avatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ─── Avatar ───────────────────────────────────────────── */
function Avatar({ name = "?", src, size = "md" }) {
  const [imgErr, setImgErr] = useState(false);
  const letter = name.charAt(0).toUpperCase();
  const color  = avatarColor(name);

  if (src && !imgErr) {
    return (
      <img
        className={`ch-avatar ch-avatar--${size}`}
        src={src}
        alt={name}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div
      className={`ch-avatar ch-avatar--${size} ch-avatar--fallback`}
      style={{ background: color }}
    >
      {letter}
    </div>
  );
}

/* ─── Date Divider ─────────────────────────────────────── */
function DateDivider({ timestamp }) {
  return (
    <div className="ch-date-divider">
      <span className="ch-date-divider__line" />
      <span className="ch-date-divider__label">{formatDateDivider(timestamp)}</span>
      <span className="ch-date-divider__line" />
    </div>
  );
}

/* ─── Message Bubble ───────────────────────────────────── */
function MessageBubble({ msg, isMine, showAvatar, providerName, providerPhoto }) {
  return (
    <div className={`ch-msg-row ${isMine ? "ch-msg-row--mine" : "ch-msg-row--theirs"}`}>

      {/* Receiver avatar slot */}
      {!isMine && (
        <div className="ch-avatar-slot">
          {showAvatar && (
            <Avatar name={providerName} src={providerPhoto} size="sm" />
          )}
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

/* ─── Typing Indicator ─────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="ch-typing">
      <span className="ch-typing__dot" />
      <span className="ch-typing__dot" />
      <span className="ch-typing__dot" />
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────── */
function MessageSkeleton() {
  return (
    <div className="ch-skeleton-wrap">
      {[{ w: "55%", r: false }, { w: "40%", r: true }, { w: "65%", r: false },
        { w: "35%", r: true  }, { w: "50%", r: false }, { w: "45%", r: true  }]
        .map((s, i) => (
          <div key={i} className={`ch-skeleton-row ${s.r ? "ch-skeleton-row--right" : ""}`}>
            {!s.r && <div className="ch-skeleton__avatar" />}
            <div className="ch-skeleton__bubble" style={{ width: s.w }} />
          </div>
        ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — ChatPage
═══════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const { providerId } = useParams();
  const navigate       = useNavigate();

  /* ── Auth from localStorage ── */
  const profile  = getUserProfile();
  const myId     = profile.id;
  const myName   = profile.userName?.split("@")[0] || "Me";
  const myPhoto  = profile.profilePhotoUrl;

  /* ── State ── */
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError,   setHistoryError]   = useState(false);
  const [providerName,   setProviderName]   = useState("Provider");
  const [providerPhoto,  setProviderPhoto]  = useState(null);
  const [isTyping,       setIsTyping]       = useState(false);
  const [showScrollFab,  setShowScrollFab]  = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [toast,          setToast]          = useState(null);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const messagesRef = useRef(null);
  const isAtBottom  = useRef(true);

  /* ── WebSocket ── */
  const { sendMessage, connected } = useChatSocket(myId, (msg) => {
    setMessages((prev) => {
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      if (!isAtBottom.current) {
        setUnreadCount((c) => c + 1);
        setShowScrollFab(true);
      }
      return [...prev, msg];
    });
  });

  /* ── Load history ── */
  useEffect(() => {
    if (!myId || !providerId) return;
    setLoadingHistory(true);
    setHistoryError(false);

    fetch(`http://localhost:8087/message/${myId}/${providerId}`, {
      credentials: "include",
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setHistoryError(true))
      .finally(() => setLoadingHistory(false));
  }, [myId, providerId]);

  /* ── Optionally fetch provider info ── */
  useEffect(() => {
    if (!providerId) return;
    fetch(`http://localhost:8087/provider/${providerId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setProviderName(data.businessName || data.name || "Provider");
          setProviderPhoto(data.profilePhotoUrl || null);
        }
      })
      .catch(() => {});
  }, [providerId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ── Scroll detection ── */
  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottom.current = atBottom;
    if (atBottom) {
      setShowScrollFab(false);
      setUnreadCount(0);
    }
  }, []);

  /* ── Focus on mount ── */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* ── Toast helper ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── Send ── */
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (!connected) { showToast("Reconnecting… please wait"); return; }
    if (!myId)       { showToast("Please log in again"); return; }

    sendMessage({
      userId:     myId,
      providerId: providerId,
      senderId:   myId,
      receiverId: providerId,
      content:    input.trim(),
    });

    setInput("");
    inputRef.current?.focus();
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [input, connected, myId, providerId, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollFab(false);
    setUnreadCount(0);
  };

  /* ── Group messages ── */
  const grouped = messages.map((msg, i) => ({
    msg,
    showAvatar: !messages[i - 1] || messages[i - 1].senderId !== msg.senderId,
    showDate:   shouldShowDateDivider(messages, i),
  }));

  const canSend = connected && !!input.trim();

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="ch-root">

      {/* ── Header ── */}
      <header className="ch-header">
        <button className="ch-back-btn" onClick={() => navigate(-1)} title="Go back">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <Avatar name={providerName} src={providerPhoto} size="md" />

        <div className="ch-header__info">
          <span className="ch-header__name">{providerName}</span>
          <span className="ch-header__status">
            <span className={`ch-status-dot ${connected ? "ch-status-dot--on" : "ch-status-dot--off"}`} />
            {connected ? "Online" : "Connecting…"}
          </span>
        </div>

        {/* Optional: more actions */}
        <div className="ch-header__actions">
          <button className="ch-icon-btn" title="Call provider">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 6.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Offline banner ── */}
      {!connected && (
        <div className="ch-offline-banner">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
          </svg>
          Reconnecting to chat…
        </div>
      )}

      {/* ── Messages ── */}
      <div className="ch-messages" ref={messagesRef} onScroll={handleScroll}>

        {loadingHistory && <MessageSkeleton />}

        {historyError && !loadingHistory && (
          <div className="ch-state-box ch-state-box--error">
            <span className="ch-state-box__icon">⚠️</span>
            <p className="ch-state-box__title">Couldn't load messages</p>
            <p className="ch-state-box__sub">Check your connection and try again.</p>
            <button className="ch-retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loadingHistory && !historyError && messages.length === 0 && (
          <div className="ch-state-box ch-state-box--empty">
            <span className="ch-state-box__icon">💬</span>
            <p className="ch-state-box__title">No messages yet</p>
            <p className="ch-state-box__sub">Say hello to {providerName}!</p>
          </div>
        )}

        {!loadingHistory && grouped.map(({ msg, showAvatar, showDate }, i) => (
          <div key={msg.id ?? i}>
            {showDate && <DateDivider timestamp={msg.timestamp} />}
            <MessageBubble
              msg={msg}
              isMine={msg.senderId === myId}
              showAvatar={showAvatar}
              providerName={providerName}
              providerPhoto={providerPhoto}
            />
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {showScrollFab && (
        <button className="ch-scroll-fab" onClick={scrollToBottom} title="Scroll to latest">
          {unreadCount > 0 && (
            <span className="ch-scroll-fab__badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      )}

      {/* ── Toast ── */}
      {toast && <div className="ch-toast">{toast}</div>}

      {/* ── Input bar ── */}
      <div className="ch-input-bar">
        <div className="ch-input-wrap">
          <textarea
            ref={inputRef}
            className="ch-textarea"
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={!myId}
          />
        </div>

        <button
          className={`ch-send-btn ${canSend ? "ch-send-btn--active" : "ch-send-btn--inactive"}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Send (Enter)"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  );
}