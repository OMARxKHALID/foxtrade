import "server-only";
import WebSocket from "ws";

const SOCKET_URL = "wss://data-stream.binance.vision/stream";
const RETRY_MAX_DELAY = 30000;

const listeners = new Map();
let socket = null;
let requestId = 1;
let retries = 0;
let reconnectTimer = null;

const isOpen = () => socket?.readyState === 1;

const send = (method, params) => {
  if (!params.length || !isOpen()) return;
  socket.send(JSON.stringify({ method, params, id: requestId++ }));
};

const handleMessage = (event) => {
  let message;
  try {
    message = JSON.parse(event.toString());
  } catch {
    return;
  }
  if (!message.stream) return;
  const set = listeners.get(message.stream);
  if (!set) return;
  set.forEach((listener) => {
    try {
      listener(message.data);
    } catch (error) {
      console.error(`Stream listener for ${message.stream} failed:`, error);
    }
  });
};

const connect = () => {
  clearTimeout(reconnectTimer);
  socket = new WebSocket(SOCKET_URL);
  socket.onmessage = (event) => handleMessage(event.data);
  socket.onopen = () => {
    retries = 0;
    send("SUBSCRIBE", [...listeners.keys()]);
  };
  socket.onclose = () => {
    socket = null;
    if (!listeners.size) return;
    const delay = Math.min(RETRY_MAX_DELAY, 1000 * 2 ** retries);
    retries += 1;
    reconnectTimer = setTimeout(connect, delay);
  };
  socket.onerror = (error) => {
    console.error("[upstream] error:", error?.message ?? error);
    socket?.close();
  };
};

export const subscribeUpstream = (stream, listener) => {
  if (!listeners.has(stream)) {
    listeners.set(stream, new Set());
    send("SUBSCRIBE", [stream]);
    if (!socket) connect();
  }
  listeners.get(stream).add(listener);
  return () => {
    const set = listeners.get(stream);
    if (!set) return;
    set.delete(listener);
    if (set.size) return;
    listeners.delete(stream);
    send("UNSUBSCRIBE", [stream]);
    if (!listeners.size && isOpen()) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
  };
};
