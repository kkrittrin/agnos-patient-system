import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

let sharedSocket = null;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const socketRef = useRef(getSocket());
  const [connected, setConnected] = useState(socketRef.current.connected);

  useEffect(() => {
    const socket = socketRef.current;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}
