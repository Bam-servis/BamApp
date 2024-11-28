import { useRef, useEffect } from "react";

const useWebSocket = (url, onMessage, onReconnectDelay = 1000) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        console.log("WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        if (onMessage) {
          const data = JSON.parse(event.data);
          onMessage(data);
        }
      };

      socketRef.current.onclose = () => {
        console.warn("WebSocket closed. Reconnecting...");
        setTimeout(connectWebSocket, onReconnectDelay);
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        socketRef.current.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url, onMessage, onReconnectDelay]);

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent:", message);
    }
  };

  return sendMessage;
};

export default useWebSocket;
