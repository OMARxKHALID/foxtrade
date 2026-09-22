const STREAM_ENDPOINT = "/api/market/stream";
const FLUSH_DELAY = 250;
const IDLE_CLOSE_DELAY = 5000;
const RETRY_MAX_DELAY = 30000;

const listeners = new Map();

let source = null;
let desired = "";
let retries = 0;
let flushTimer = null;
let reconnectTimer = null;
let idleTimer = null;

const clearTimers = () => {
  clearTimeout(flushTimer);
  clearTimeout(reconnectTimer);
};

const teardown = () => {
  if (!source) return;
  source.onopen = null;
  source.onmessage = null;
  source.onerror = null;
  source.close();
  source = null;
};

const handleMessage = (event) => {
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    return;
  }
  if (!message.stream) return;
  listeners.get(message.stream)?.forEach((listener) => listener(message.data));
};

const connect = () => {
  clearTimers();
  teardown();
  if (!listeners.size || !desired) return;
  source = new EventSource(`${STREAM_ENDPOINT}?streams=${desired}`);
  source.onmessage = handleMessage;
  source.onopen = () => {
    retries = 0;
  };
  source.onerror = () => {
    teardown();
    if (!listeners.size) return;
    const delay = Math.min(RETRY_MAX_DELAY, 1000 * 2 ** retries);
    retries += 1;
    reconnectTimer = setTimeout(connect, delay);
  };
};

const scheduleRebuild = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const next = [...listeners.keys()].sort().join(",");
    if (next === desired && source) return;
    desired = next;
    retries = 0;
    connect();
  }, FLUSH_DELAY);
};

const closeWhenIdle = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (listeners.size || !source) return;
    clearTimers();
    teardown();
    desired = "";
  }, IDLE_CLOSE_DELAY);
};

export const subscribeStream = (stream, listener) => {
  clearTimeout(idleTimer);
  if (!listeners.has(stream)) {
    listeners.set(stream, new Set());
    scheduleRebuild();
  }
  listeners.get(stream).add(listener);
  if (!source && !reconnectTimer && desired) connect();

  return () => {
    const set = listeners.get(stream);
    if (!set) return;
    set.delete(listener);
    if (set.size) return;
    listeners.delete(stream);
    scheduleRebuild();
    if (!listeners.size) closeWhenIdle();
  };
};
