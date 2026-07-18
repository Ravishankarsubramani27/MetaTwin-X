/**
 * useWebSocket.js
 * Reusable WebSocket hook with auto-reconnect and status tracking.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { WS_RECONNECT_MS } from "../config/constants";

export default function useWebSocket(url, onMessage) {
  const [status, setStatus]   = useState("disconnected"); // connected | disconnected | error
  const wsRef     = useRef(null);
  const retryRef  = useRef(null);
  const onMsgRef  = useRef(onMessage);

  // Keep callback ref fresh without restarting the connection
  useEffect(() => { onMsgRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        clearTimeout(retryRef.current);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMsgRef.current?.(data);
        } catch { /* ignore malformed messages */ }
      };
      ws.onerror = () => setStatus("error");
      ws.onclose = () => {
        setStatus("disconnected");
        retryRef.current = setTimeout(connect, WS_RECONNECT_MS);
      };
    } catch {
      setStatus("error");
      retryRef.current = setTimeout(connect, WS_RECONNECT_MS);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    clearTimeout(retryRef.current);
    wsRef.current?.close();
  }, []);

  return { status, disconnect };
}
