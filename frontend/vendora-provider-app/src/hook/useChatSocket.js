import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

export function useChatSocket(myId, onMessage) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8087/ws",
      connectHeaders: {
        login: myId,        // This becomes Principal in WebsocketAuthConfig
      },
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/user/queue/messages`, (frame) => {
          const msg = JSON.parse(frame.body);
          onMessage(msg);
        });
      },
      onDisconnect: () => setConnected(false),
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