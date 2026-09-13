const SOCKET_URL = "wss://data-stream.binance.vision/stream";
const FLUSH_DELAY = 250;
const IDLE_CLOSE_DELAY = 5000;

const listeners = new Map();
const pendingSubscribe = new Set();
const pendingUnsubscribe = new Set();

let socket = null;
let requestId = 1;
let retries = 0;
let flushTimer = null;
let reconnectTimer = null;
let idleTimer = null;

const isOpen = () => socket?.readyState === WebSocket.OPEN;

const send = (method, params) => {
  if (!params.length || !isOpen()) return;
  socket.send(JSON.stringify({ method, params, id: requestId++ }));
};

const flush = () => {
  flushTimer = null;
  if (!isOpen()) return;
  send("UNSUBSCRIBE", [...pendingUnsubscribe]);
  send("SUBSCRIBE", [...pendingSubscribe]);
  pendingUnsubscribe.clear();
  pendingSubscribe.clear();
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY);
};

const handleMessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.stream) return;
  listeners.get(message.stream)?.forEach((listener) => listener(message.data));
};

const connect = () => {
  clearTimeout(reconnectTimer);
  socket = new WebSocket(SOCKET_URL);
  socket.onmessage = handleMessage;
  socket.onopen = () => {
    retries = 0;
    pendingUnsubscribe.clear();
    listeners.forEach((_, stream) => pendingSubscribe.add(stream));
    scheduleFlush();
  };
  socket.onclose = () => {
    socket = null;
    if (!listeners.size) return;
    const delay = Math.min(30000, 1000 * 2 ** retries);
    retries += 1;
    reconnectTimer = setTimeout(connect, delay);
  };
  socket.onerror = () => socket?.close();
};

const closeWhenIdle = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (listeners.size || !socket) return;
    socket.onclose = null;
    socket.close();
    socket = null;
  }, IDLE_CLOSE_DELAY);
};

export const subscribeStream = (stream, listener) => {
  clearTimeout(idleTimer);
  if (!listeners.has(stream)) {
    listeners.set(stream, new Set());
    pendingUnsubscribe.delete(stream);
    pendingSubscribe.add(stream);
    scheduleFlush();
  }
  listeners.get(stream).add(listener);
  if (!socket) connect();

  return () => {
    const set = listeners.get(stream);
    if (!set) return;
    set.delete(listener);
    if (set.size) return;
    listeners.delete(stream);
    pendingSubscribe.delete(stream);
    pendingUnsubscribe.add(stream);
    scheduleFlush();
    if (!listeners.size) closeWhenIdle();
  };
};
