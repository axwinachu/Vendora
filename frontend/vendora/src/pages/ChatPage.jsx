import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/Chat.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

/* ─── Auth ──────────────────────────────────────────────── */
function getUserProfile() {
  try { return JSON.parse(localStorage.getItem("user_profile") || "{}"); }
  catch { return {}; }
}

/* ─── Helpers ───────────────────────────────────────────── */
const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const formatPreview = (ts) => {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

/* Initials avatar */
function Avatar({ name, size = "conv" }) {
  const safeName = name || "";
  const colors = ["#1B4332","#2D6A4F","#40916C","#1E3A5F","#374151"];
  const idx = safeName.charCodeAt(0) % colors.length || 0;
  const initials = safeName
    .split(" ").slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (
    <div
      className={`ch-av ch-av--${size} ch-av--letter`}
      style={{ background: colors[idx] }}
    >
      {initials || "?"}
    </div>
  );
}

/* Send icon */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ─── Main ──────────────────────────────────────────────── */
export default function ChatPage() {
  const { providerId: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = getUserProfile();
  const myId = profile.id;
  const myName = profile.userName || "Me";

  const [activeId, setActiveId]     = useState(routeId || null);
  const [activeName, setActiveName] = useState(location.state?.providerName || "");

  const [convs, setConvs]       = useState([]);
  const [convLoad, setConvLoad] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msgLoad, setMsgLoad]   = useState(false);
  const [input, setInput]       = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* ── Socket ─────────────────────────────────────────── */
  const { sendMessage, connected } = useChatSocket(myId, (incoming) => {
    const peerId = incoming.senderId === myId ? incoming.receiverId : incoming.senderId;

    if (peerId === activeId) {
      setMessages((prev) => [...prev, incoming]);
    }

    setConvs((prev) => {
      const exists = prev.some((c) => c.id === peerId);
      if (!exists) {
        return [
          { id: peerId, name: incoming.senderName || peerId, lastMsg: incoming.content, lastTs: incoming.timestamp, unread: 1 },
          ...prev,
        ];
      }
      return prev.map((c) =>
        c.id === peerId
          ? { ...c, lastMsg: incoming.content, lastTs: incoming.timestamp, unread: c.id === activeId ? 0 : (c.unread || 0) + 1 }
          : c
      );
    });
  });

  /* ── Load conversations ──────────────────────────────── */
  useEffect(() => {
    if (!myId) return;
    setConvLoad(true);
    fetch(`http://localhost:8087/message/conversations/${myId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setConvs(
          data.map((c) => ({
            id: c.peerId,
            name: c.peerName || c.peerId,
            lastMsg: c.lastMessage,
            lastTs: c.lastTimestamp,
            unread: 0,
          }))
         
        );
         console.log(data)
      }
    )
      .finally(() => setConvLoad(false));
      
  }, [myId]);

  /* ── Load messages ───────────────────────────────────── */
  useEffect(() => {
    if (!myId || !activeId) return;
    setMsgLoad(true);
    fetch(`http://localhost:8087/message/${myId}/${activeId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMessages(data || []))
      .finally(() => setMsgLoad(false));
  }, [myId, activeId]);

  /* ── Auto-scroll ─────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ────────────────────────────────────────────── */
  const handleSend = () => {
    if (!input.trim() || !activeId) return;
    sendMessage({
      userId: myId, providerId: activeId,
      senderId: myId, receiverId: activeId,
      content: input.trim(),
    });
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Open conversation ───────────────────────────────── */
  const openConv = (c) => {
    setActiveId(c.id);
    setActiveName(c.name);
    setConvs((prev) => prev.map((x) => x.id === c.id ? { ...x, unread: 0 } : x));
    navigate(`/chat/${c.id}`);
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
    <Navbar/>
    <div className={`ch-shell ${activeId ? "ch-shell--chat-open" : ""}`}>

      {/* ── SIDEBAR ── */}
      <aside className="ch-sidebar">
        <div className="ch-sidebar__head">
          <div className="ch-sidebar__me">
            <Avatar name={myName} size="md" />
            <div className="ch-sidebar__me-info">
              <span className="ch-sidebar__me-name">{myName}</span>
            </div>
          </div>
          <span className={connected ? "ch-pill ch-pill--on" : "ch-pill ch-pill--off"}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <div className="ch-sidebar__title-row">
          <span className="ch-sidebar__title">Messages</span>
          {convs.length > 0 && (
            <span className="ch-sidebar__total-badge">{convs.length}</span>
          )}
        </div>

        <div className="ch-conv-list">
          {convLoad && (
            <div className="ch-side-skel">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="ch-side-skel__item">
                  <div className="ch-side-skel__av" />
                  <div className="ch-side-skel__lines">
                    <div className="ch-side-skel__line ch-side-skel__line--60" />
                    <div className="ch-side-skel__line ch-side-skel__line--40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!convLoad && convs.length === 0 && (
            <div className="ch-conv-empty">
              <span>💬</span>
              <p>No conversations yet</p>
              <small>Start a chat from a provider profile</small>
            </div>
          )}

          {convs.map((c) => (
            <button
              key={c.id}
              className={`ch-conv ${c.id === activeId ? "ch-conv--active" : ""}`}
              onClick={() => openConv(c)}
            >
              <div className="ch-conv__av-wrap">
                <Avatar name={c.name} size="conv" />
              </div>
              <div className="ch-conv__body">
                <div className="ch-conv__top">
                  <span className="ch-conv__name">{c.name}</span>
                  <span className="ch-conv__time">{formatPreview(c.lastTs)}</span>
                </div>
                <div className="ch-conv__bottom">
                  <span className="ch-conv__preview">{c.lastMsg || "No messages yet"}</span>
                  {c.unread > 0 && (
                    <span className="ch-conv__badge">{c.unread > 9 ? "9+" : c.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── PANEL ── */}
      <div className="ch-panel">

        {!activeId && (
          <div className="ch-panel-empty">
            <div className="ch-panel-empty__icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="ch-panel-empty__title">Your messages</p>
            <p className="ch-panel-empty__sub">Select a conversation from the list to start chatting</p>
          </div>
        )}

        {activeId && (
          <>
            {/* Header */}
            <div className="ch-panel-head">
              <Avatar name={activeName} size="md" />
              <div className="ch-panel-head__info">
                <span className="ch-panel-head__name">{activeName || activeId}</span>
                <div className="ch-panel-head__status">
                  <span className={connected ? "ch-dot ch-dot--on" : "ch-dot ch-dot--off"} />
                  <span>{connected ? "Online" : "Offline"}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="ch-messages">
              {msgLoad && (
                <div className="ch-skel">
                  {[80, 140, 100, 170, 90].map((w, i) => (
                    <div key={i} className={`ch-skel__row ${i % 2 === 0 ? "" : "ch-skel__row--r"}`}>
                      <div className="ch-skel__av" />
                      <div className="ch-skel__bubble" style={{ width: w }} />
                    </div>
                  ))}
                </div>
              )}

              {!msgLoad && messages.length === 0 && (
                <div className="ch-state ch-state--empty">
                  <div className="ch-state__icon">👋</div>
                  <p className="ch-state__title">Say hello!</p>
                  <p className="ch-state__sub">Be the first to send a message</p>
                </div>
              )}

              {messages.map((m, i) => {
                const isMine = m.senderId === myId;
                return (
                  <div
                    key={m.id || i}
                    className={`ch-row ${isMine ? "ch-row--mine" : "ch-row--theirs"}`}
                  >
                    {!isMine && (
                      <div className="ch-row__av-slot">
                        {(i === messages.length - 1 || messages[i + 1]?.senderId !== m.senderId) && (
                          <Avatar name={activeName} size="sm" />
                        )}
                      </div>
                    )}
                    <div className={`ch-bwrap ${isMine ? "ch-bwrap--mine" : "ch-bwrap--theirs"}`}>
                      <div className={`ch-bubble ${isMine ? "ch-bubble--mine" : "ch-bubble--theirs"}`}>
                        {m.content}
                      </div>
                      <span className="ch-bubble__time">{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="ch-input-bar">
              <div className="ch-input-wrap">
                <input
                  ref={inputRef}
                  className="ch-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  autoComplete="off"
                />
              </div>
              <button
                className={`ch-send ${input.trim() ? "ch-send--on" : "ch-send--off"}`}
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    <Footer/>
    </>
  );
}