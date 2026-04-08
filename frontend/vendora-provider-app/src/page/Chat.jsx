import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/chat.css";

/* ─── Auth ──────────────────────────────────────────────── */
function getProviderProfile() {
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

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ name, size = "conv" }) {
  const safeName = name || "";
  const colors = ["#1B4332", "#2D6A4F", "#40916C", "#1E3A5F", "#374151"];
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

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   PROVIDER CHAT PAGE

   Role mapping  (opposite of user side):
   ┌─────────────┬──────────────┬──────────────────────────┐
   │             │  User side   │     Provider side        │
   ├─────────────┼──────────────┼──────────────────────────┤
   │ myId        │ user's id    │ provider's id            │
   │ activeId    │ provider id  │ user/customer id         │
   │ API fetch   │ /{myId}/{activeId} │ /{activeId}/{myId} │
   │ sendMessage │ userId=myId  │ userId=activeId          │
   │             │ providerId=activeId │ providerId=myId   │
   └─────────────┴──────────────┴──────────────────────────┘
═══════════════════════════════════════════════════════════ */
export default function ProviderChatPage() {
  // Route: /chat/:userId  (the customer who messaged us)
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Provider's own identity
  const profile  = getProviderProfile();
  const myId     = profile.id;
  const myName   = profile.userName || "Provider";

  // Active customer we're chatting with
  const [activeId,   setActiveId]   = useState(routeUserId || null);
  const [activeName, setActiveName] = useState(location.state?.userName || "");

  const [convs,     setConvs]     = useState([]);
  const [convLoad,  setConvLoad]  = useState(true);
  const [messages,  setMessages]  = useState([]);
  const [msgLoad,   setMsgLoad]   = useState(false);
  const [input,     setInput]     = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* ── WebSocket ───────────────────────────────────────────
     myId here is the PROVIDER id — backend routes messages
     to /user/{providerId}/queue/messages correctly because
     the STOMP login header = myId (provider id).
  ── */
  const { sendMessage, connected } = useChatSocket(myId, (incoming) => {
    // Who is the other person in this message?
    const peerId = incoming.senderId === myId ? incoming.receiverId : incoming.senderId;

    // Append to messages if it belongs to the open conversation
    if (peerId === activeId) {
      setMessages((prev) => {
        if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    }

    // Update sidebar preview + unread count
    setConvs((prev) => {
      const exists = prev.some((c) => c.id === peerId);
      if (!exists) {
        // New customer — add them to the sidebar automatically
        return [
          {
            id: peerId,
            name: incoming.senderName || peerId,
            lastMsg: incoming.content,
            lastTs: incoming.timestamp,
            unread: peerId === activeId ? 0 : 1,
          },
          ...prev,
        ];
      }
      return prev.map((c) =>
        c.id === peerId
          ? {
              ...c,
              lastMsg: incoming.content,
              lastTs: incoming.timestamp,
              unread: c.id === activeId ? 0 : (c.unread || 0) + 1,
            }
          : c
      );
    });
  });

  /* ── Load all conversations for this provider ────────────
     GET /message/conversations/{myId}
     Returns everyone who has ever chatted with this provider.
  ── */
  useEffect(() => {
    if (!myId) return;
    setConvLoad(true);
    fetch(`http://localhost:8087/message/conversations/${myId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setConvs(
          data.map((c) => ({
            id:      c.peerId,
            name:    c.peerName || c.peerId,
            lastMsg: c.lastMessage,
            lastTs:  c.lastTimestamp,
            unread:  0,
          }))
        );
      })
      .catch((e) => console.error("Conversations fetch failed:", e))
      .finally(() => setConvLoad(false));
  }, [myId]);

  /* ── Load message history when a customer is selected ────
     KEY DIFFERENCE from user side:
       User:     GET /message/{myId}/{activeId}
       Provider: GET /message/{activeId}/{myId}
                              ↑ customer   ↑ me
     This matches ChatRoomService.getOrCreateRoom(userId, providerId)
  ── */
  useEffect(() => {
    if (!myId || !activeId) return;
    setMsgLoad(true);
    setMessages([]);

    fetch(`http://localhost:8087/message/${activeId}/${myId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Message history failed:", e))
      .finally(() => setMsgLoad(false));

    // Clear unread when opening a conversation
    setConvs((prev) => prev.map((c) => c.id === activeId ? { ...c, unread: 0 } : c));
  }, [myId, activeId]);

  /* ── Auto-scroll ─────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message ────────────────────────────────────────
     KEY DIFFERENCE from user side:
       User:     { userId: myId,     providerId: activeId }
       Provider: { userId: activeId, providerId: myId     }
     userId must always be the CUSTOMER, providerId the PROVIDER.
     This is what ChatRoomService uses to look up/create the room.
  ── */
  const handleSend = () => {
    if (!input.trim() || !activeId || !connected) return;
    sendMessage({
      userId:     activeId,  // customer
      providerId: myId,      // me (provider)
      senderId:   myId,
      receiverId: activeId,
      content:    input.trim(),
    });
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const openConv = (c) => {
    setActiveId(c.id);
    setActiveName(c.name);
    setConvs((prev) => prev.map((x) => x.id === c.id ? { ...x, unread: 0 } : x));
    navigate(`/chat/${c.id}`);
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className={`ch-shell ${activeId ? "ch-shell--chat-open" : ""}`}>

      {/* ── SIDEBAR ── */}
      <aside className="ch-sidebar">
        <div className="ch-sidebar__head">
          <div className="ch-sidebar__me">
            <Avatar name={myName} size="md" />
            <div className="ch-sidebar__me-info">
              <span className="ch-sidebar__me-name">{myName}</span>
              <span className="ch-sidebar__me-role">Provider</span>
            </div>
          </div>
          <span className={connected ? "ch-pill ch-pill--on" : "ch-pill ch-pill--off"}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <div className="ch-sidebar__title-row">
          <span className="ch-sidebar__title">Customers</span>
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
              <p>No customers yet</p>
              <small>Customers will appear here when they message you</small>
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
            <p className="ch-panel-empty__title">Your customers</p>
            <p className="ch-panel-empty__sub">Select a customer from the left to reply</p>
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
                  <p className="ch-state__title">No messages yet</p>
                  <p className="ch-state__sub">Send a reply to start the conversation</p>
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
                  placeholder="Reply to customer…"
                  autoComplete="off"
                  disabled={!connected}
                />
              </div>
              <button
                className={`ch-send ${input.trim() && connected ? "ch-send--on" : "ch-send--off"}`}
                onClick={handleSend}
                disabled={!input.trim() || !connected}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}