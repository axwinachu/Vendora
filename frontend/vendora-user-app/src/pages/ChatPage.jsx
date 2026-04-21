import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatSocket } from "../hook/useChatSocket";
import "../styles/Chat.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ─── Profile ───────────────────────── */
function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem("user_profile") || "{}");
  } catch {
    return {};
  }
}

/* ─── Time helpers ───────────────────── */
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

/* ─── Avatar ───────────────────────── */
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

/* ─── Main Component ─────────────────── */
export default function ChatPage() {
  const { userId: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = getUserProfile();
  const myId = profile.id;
  const myName = profile.userName || "Me";

  const [activeId, setActiveId] = useState(routeId || null);
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

  // Keep activeId accessible inside socket callback without stale closure
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  /* ─── SOCKET ───────────────────────── */
  const { sendMessage, connected } = useChatSocket(myId, (incoming) => {
    const peerId =
      incoming.senderId === myId ? incoming.receiverId : incoming.senderId;

    if (peerId === activeIdRef.current) {
      setMessages((prev) => {
        // FIX: compare m._clientId (local field) against incoming.clientId (backend field)
        const optimisticIndex = prev.findIndex(
          (m) => m._clientId && m._clientId === incoming.clientId
        );

        if (optimisticIndex !== -1) {
          // Replace optimistic message with real one from backend
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

  /* ─── LOAD CONVERSATIONS ───────────── */
  useEffect(() => {
    if (!myId) return;

    fetch(`http://localhost:8888/message/conversations/${myId}`)
      .then((r) => r.json())
      .then((data) => {
        setConvs(
          data.map((c) => ({
            id: c.peerId,
            name: c.peerName || c.peerId,
            image: c.peerImage,
            lastMsg: c.lastMessage,
            lastTs: c.lastTimestamp,
          }))
        );
      })
      .catch((err) => console.error("Failed to load conversations:", err));
  }, [myId]);

  /* ─── LOAD MESSAGES ────────────────── */
  useEffect(() => {
    if (!myId || !activeId) return;

    setLoading(true);

    fetch(`http://localhost:8888/message/${myId}/${activeId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data || []))
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoading(false));
  }, [myId, activeId]);

  /* ─── AUTO SCROLL ─────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── SEND MESSAGE ─────────────────── */
  const handleSend = () => {
    if (!input.trim() || !activeId) return;

    const clientId = `opt_${Date.now()}`;

    // Optimistic message uses _clientId as a local-only tracking field
    const optimisticMsg = {
      _clientId: clientId,
      senderId: myId,
      receiverId: activeId,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // FIX: send as "clientId" (no underscore) to match ChatMessageDTO field
    sendMessage({
      clientId: clientId,       // ✅ matches backend ChatMessageDTO.clientId
      userId: myId,             // customer id — identifies the chat room
      providerId: activeId,     // provider id — identifies the chat room
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

  /* ─── UI ─────────────────────────── */
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
                <div className="ch-sidebar__me-email">Customer</div>
              </div>
            </div>
            <div className={`ch-pill ${connected ? "ch-pill--on" : "ch-pill--off"}`}>
              {connected ? "Online" : "Offline"}
            </div>
          </div>

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

        {/* CHAT PANEL */}
        <div className="ch-panel">

          {!activeId ? (
            <div className="ch-panel-empty">
              <div className="ch-panel-empty__icon-wrap">💬</div>
              <div className="ch-panel-empty__title">Select a conversation</div>
              <div className="ch-panel-empty__sub">
                Choose a provider to start chatting
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
                          <Avatar name={activeName} image={activeImage} size="sm" />
                        )}
                      </div>

                      <div
                        className={`ch-bwrap ${
                          isMine ? "ch-bwrap--mine" : "ch-bwrap--theirs"
                        }`}
                      >
                        <div
                          className={`ch-bubble ${
                            isMine
                              ? "ch-bubble--mine"
                              : "ch-bubble--theirs"
                          } ${m._clientId ? "ch-bubble--optimistic" : ""}`}
                        >
                          {m.content}
                        </div>

                        <span className="ch-bubble__time">
                          {formatTime(m.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div className="ch-input-bar">
                <input
                  ref={inputRef}
                  className="ch-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />

                <button
                  className={`ch-send ${input.trim() ? "ch-send--on" : "ch-send--off"}`}
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

      <Footer />
    </>
  );
}