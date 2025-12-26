import { useEffect, useRef, useState } from 'react';

type UseSSEParams = {
  url?: string;
  enabled?: boolean;
  mockEmitter?: { subscribe: (cb: (event: MessageEvent) => void) => () => void };
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
};

export const useSSE = ({ url, enabled = false, mockEmitter, onMessage, onError }: UseSSEParams) => {
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (mockEmitter) {
      unsubscribeRef.current = mockEmitter.subscribe((event) => {
        onMessage?.(event);
      });
      setConnected(true);
      return () => {
        unsubscribeRef.current?.();
        setConnected(false);
      };
    }

    if (!url) return;
    const es = new EventSource(url);
    sourceRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (evt) => onMessage?.(evt);
    es.onerror = (evt) => {
      onError?.(evt);
      setConnected(false);
    };
    return () => {
      es.close();
      setConnected(false);
    };
  }, [enabled, url, mockEmitter, onMessage, onError]);

  return {
    connected,
  };
};
