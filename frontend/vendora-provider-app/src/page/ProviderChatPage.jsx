import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/chat.css";

/* ─── Auth ──────────────────────────────────────────────── */
function getProviderProfile() {
  try {
    return JSON.parse(localStorage.getItem("user_profile") || "{}");
  } catch {
    return {};
  }
}

/* ─── Helpers ───────────────────────────────────────────── */
const formatTime = (ts) =>
  ts
    ? new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const formatPreview = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

/* ─── Avatar ───────────────────────────────────────────── */
function Avatar({ name, image, size = "conv" }) {
  if (image) {
    return <img src={image} className={`ch-av ch-av--${size}`} alt={name} />;
  }

  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`ch-av ch-av--${size} ch-av--letter`}>
      {initials || "?"}
    </div>
  );
}

export default function ProviderChatPage() {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = getProviderProfile();
  const myId   = profile.id;
  const myRole = "PROVIDER";                      // role for WS auth
  const myName = profile.userName || "Provider";

  const [activeId, setActiveId] = useState(routeUserId || null);
  const [activeName, setActiveName] = useState(location.state?.userName || "");
  const [activeImage, setActiveImage] = useState(
    location.state?.userImage || null
  );

  const [convs, setConvs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeIdRef = useRef(activeId);

  // Sync activeId with URL param routeUserId
  useEffect(() => {
    setActiveId(routeUserId || null);
    activeIdRef.current = routeUserId || null;
    if (routeUserId && routeUserId !== location.state?.userId) {
       setActiveName(location.state?.userName || "");
       setActiveImage(location.state?.userImage || null);
    }
  }, [routeUserId, location.state]);

  // Fetch customer info if name is missing (refresh/direct link)
  useEffect(() => {
    if (!activeId || activeName || !myId) return;

    fetch(`http://localhost:8888/user/${activeId}`, {
       headers: { "X-User-Id": myId }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setActiveName(data.userName || activeId);
          setActiveImage(data.profilePhotoUrl || null);
        }
      })
      .catch(() => {});
  }, [activeId, activeName, myId]);

  /* ─── SOCKET ────────────────────────────────────────────── */
  const { sendMessage, connected } = useChatSocket(myId, myRole, (incoming) => {
    const peerId =
      incoming.senderId === myId ? incoming.receiverId : incoming.senderId;

    if (peerId === activeIdRef.current) {
      setMessages((prev) => {
        // If backend echoed our optimistic message, replace it
        const optimisticIndex = prev.findIndex(
          (m) => m._clientId && m._clientId === incoming.clientId
        );

        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = incoming;
          return updated;
        }

        // Avoid true duplicates by real backend id
        if (incoming.id && prev.some((m) => m.id === incoming.id)) {
          return prev;
        }

        return [...prev, incoming];
      });
    }
  });

  /* ── LOAD CONVERSATIONS ─────────────────────────────── */
  useEffect(() => {
    if (!myId) return;

    // Correct endpoint: no path variable — userId comes from X-User-Id header
    fetch("http://localhost:8888/message/conversations", {
      headers: { "X-User-Id": myId, "Content-Type": "application/json" },
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        setConvs(
          data.map((c) => ({
            id:      c.peerId,
            name:    c.peerName  || c.peerId,
            image:   c.peerImage || null,
            lastMsg: c.lastMessage,
            lastTs:  c.lastTimestamp,
          }))
        );
      })
      .catch((err) => console.error("Failed to load conversations:", err));
  }, [myId]);

  /* ── LOAD MESSAGES ───────────────────────────────────── */
  useEffect(() => {
    if (!myId || !activeId) return;

    setLoading(true);

    // activeId = customer (userId), myId = provider (providerId)
    // X-User-Id header is required by MessageController for authorization check
    fetch(`http://localhost:8888/message/${activeId}/${myId}`, {
      headers: { "X-User-Id": myId, "Content-Type": "application/json" },
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoading(false));
  }, [myId, activeId]);

  /* ── AUTO SCROLL ─────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── SEND MESSAGE ────────────────────────────────────── */
  const handleSend = () => {
    if (!input.trim() || !activeId) return;

    const clientId = `opt_${Date.now()}`;

    const optimisticMsg = {
      _clientId: clientId,
      senderId: myId,
      receiverId: activeId,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    sendMessage({
      clientId: clientId,     // ← matches backend ChatMessageDTO field name
      userId: activeId,       // customer id
      providerId: myId,       // provider id
      senderId: myId,
      receiverId: activeId,
      content: input.trim(),
    });

    setInput("");
    inputRef.current?.focus();
  };

  const openConv = (c) => {
    setActiveId(c.id);
    setActiveName(c.name);
    setActiveImage(c.image);
    setMessages([]);
    navigate(`/chat/${c.id}`);
  };

  return (
    <div className="ch-shell">

      {/* ─── SIDEBAR ─── */}
      <aside className="ch-sidebar">

        {/* HEADER */}
        <div className="ch-sidebar__head">
          <div className="ch-sidebar__me">
            <Avatar name={myName} size="md" />
            <div className="ch-sidebar__me-info">
              <div className="ch-sidebar__me-name">{myName}</div>
              <div className="ch-sidebar__me-email">Provider</div>
            </div>
          </div>

          <div className={`ch-pill ${connected ? "ch-pill--on" : "ch-pill--off"}`}>
            {connected ? "Online" : "Offline"}
          </div>
        </div>

        {/* CONVERSATIONS */}
        <div className="ch-conv-list">
          {convs.length === 0 && (
            <div className="ch-conv-empty">No conversations yet</div>
          )}
          {convs.map((c) => (
            <div
              key={c.id}
              onClick={() => openConv(c)}
              className={`ch-conv ${activeId === c.id ? "ch-conv--active" : ""}`}
            >
              <div className="ch-conv__av-wrap">
                <Avatar name={c.name} image={c.image} />
              </div>

              <div className="ch-conv__body">
                <div className="ch-conv__top">
                  <div className="ch-conv__name">{c.name}</div>
                  <div className="ch-conv__time">{formatPreview(c.lastTs)}</div>
                </div>

                <div className="ch-conv__bottom">
                  <div className="ch-conv__preview">{c.lastMsg}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ─── CHAT PANEL ─── */}
      <div className="ch-panel">

        {!activeId ? (
          <div className="ch-panel-empty">
            <div className="ch-panel-empty__icon-wrap">💬</div>
            <div className="ch-panel-empty__title">Select a conversation</div>
            <div className="ch-panel-empty__sub">
              Choose a customer to start chatting
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="ch-panel-head">
              <Avatar name={activeName} image={activeImage} size="md" />

              <div className="ch-panel-head__info">
                <div className="ch-panel-head__name">{activeName}</div>
                <div className="ch-panel-head__status">
                  <span className="ch-dot ch-dot--on"></span>
                  Online
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="ch-messages">
              {loading && (
                <div className="ch-loading">Loading messages...</div>
              )}

              {!loading && messages.length === 0 && (
                <div className="ch-no-messages">
                  No messages yet. Say hello!
                </div>
              )}

              {messages.map((m, i) => {
                const isMine = m.senderId === myId;

                return (
                  <div
                    key={m.id || m._clientId || i}
                    className={`ch-row ${isMine ? "ch-row--mine" : "ch-row--theirs"}`}
                  >
                    <div className="ch-row__av-slot">
                      {!isMine && (
                        <Avatar
                          name={activeName}
                          image={activeImage}
                          size="sm"
                        />
                      )}
                    </div>

                    <div
                      className={`ch-bwrap ${
                        isMine ? "ch-bwrap--mine" : "ch-bwrap--theirs"
                      }`}
                    >
                      <div
                        className={`ch-bubble ${
                          isMine ? "ch-bubble--mine" : "ch-bubble--theirs"
                        } ${m._clientId ? "ch-bubble--optimistic" : ""}`}
                      >
                        {m.content}
                      </div>

                      <div className="ch-bubble__time">
                        {formatTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="ch-input-bar">
              <div className="ch-input-wrap">
                <textarea
                  ref={inputRef}
                  className="ch-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>

              <button
                className={`ch-send ${
                  input.trim() ? "ch-send--on" : "ch-send--off"
                }`}
                onClick={handleSend}
                disabled={!input.trim()}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}