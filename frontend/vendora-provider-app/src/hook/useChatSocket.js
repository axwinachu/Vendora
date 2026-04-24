import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function useChatSocket(myId, myRole, onMessage) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Keep onMessage ref fresh to avoid stale closure
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!myId || !myRole) {
      console.warn("WS skipped → missing myId or role", { myId, myRole });
      return;
    }

    console.log("Connecting WS with:", myId, myRole);

    const client = new Client({
      // SockJS required — backend registers /ws endpoint with .withSockJS()
      // Raw ws:// URLs are NOT supported by SockJS endpoints
      webSocketFactory: () => new SockJS("http://localhost:8888/ws"),

      connectHeaders: {
        "X-User-Id":   String(myId),
        "X-User-Role": String(myRole).toUpperCase(),
        login:    String(myId),
        passcode: String(myRole).toUpperCase(),
      },

      reconnectDelay: 4000,

      onConnect: () => {
        console.log("✅ WS CONNECTED");
        setConnected(true);
        client.subscribe("/user/queue/messages", (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            console.log("📩 Incoming:", msg);
            onMessageRef.current?.(msg);
          } catch (e) {
            console.error("Failed to parse message:", e);
          }
        });
      },

      onDisconnect: () => {
        console.log("❌ WS DISCONNECTED");
        setConnected(false);
      },

      onStompError: (frame) => console.error("STOMP error:", frame),
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [myId, myRole]);

  const sendMessage = (dto) => {
    if (!clientRef.current?.connected) {
      console.error("❌ WS NOT CONNECTED — cannot send");
      return;
    }
    console.log("📤 Sending:", dto);
    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(dto),
    });
  };

  return { sendMessage, connected };
}