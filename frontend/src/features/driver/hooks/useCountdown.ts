import { useEffect, useRef, useState } from "react";

// Computes remaining seconds until an absolute deadline (epoch ms).
//
// Deliberately does NOT take a "seconds remaining" number as input — that
// kind of value goes stale the instant it's captured (e.g. re-renders,
// remounts, or a fresh fetch replacing the object). Working off a fixed
// deadline timestamp instead means the countdown is always correct no
// matter when/how often the component using it mounts.
//
// Calls onExpire exactly once when the deadline passes.
export function useCountdown(expiresAt: number | undefined, onExpire?: () => void) {
  const computeRemaining = () => {
    if (!expiresAt || isNaN(expiresAt)) return 0;
    return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(computeRemaining);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const next = computeRemaining();
      setRemaining(next);
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    // Fire once immediately in case expiresAt is already in the past
    // (also handles the initial "remaining" value for a new expiresAt).
    tick();

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return remaining;
}