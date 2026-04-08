import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

export function useChatSocket(myId, onMessage) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!myId) return;

    const client = new Client({
      brokerURL: "ws://localhost:8087/ws",
      connectHeaders: {
        login: String(myId),
      },
      reconnectDelay: 3000,

      onConnect: () => {
        setConnected(true);
        client.subscribe("/user/queue/messages", (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            onMessageRef.current?.(msg);
          } catch (e) {
            console.error("Failed to parse message:", e);
          }
        });
      },

      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.error("STOMP error:", frame),
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [myId]);

  const sendMessage = (dto) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(dto),
      });
    }
  };

  return { sendMessage, connected };
}