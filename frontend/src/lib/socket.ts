import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

// One shared connection for the whole app — created lazily on first use,
// reused everywhere via getSocket(). withCredentials sends the
// Access_Token cookie automatically, same as the axios instance.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:5000", {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}