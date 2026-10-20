"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 15_000;
const subscribe = (onTick: () => void) => {
  const t = setInterval(onTick, TICK_MS);
  return () => clearInterval(t);
};
// The snapshot is the current 15-second bucket, so it stays stable between ticks.
// On the server there is no clock: render placeholders and fill in after hydration.
function useNow(): Date | null {
  const bucket = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / TICK_MS), () => null);
  return bucket === null ? null : new Date(bucket * TICK_MS);
}

const fmt = (d: Date, timeZone: string) =>
  d.toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" });

// India and New York side by side: US clients can see when the working hours overlap.
export function Clocks() {
  const now = useNow();
  return (
    <span className="strip-readings">
      <span>
        IST <b>{now ? fmt(now, "Asia/Kolkata") : "--:--"}</b>
      </span>
      <span>
        NYC <b>{now ? fmt(now, "America/New_York") : "--:--"}</b>
      </span>
    </span>
  );
}

export function DaysLeft({ due }: { due: string }) {
  const now = useNow();
  if (!now) return <b>--</b>;
  const end = new Date(`${due}T23:59:59+05:30`).getTime();
  const days = Math.ceil((end - now.getTime()) / 86_400_000);
  return <b>{days > 1 ? `${days} days left` : days === 1 ? "Due tomorrow" : days === 0 ? "Due today" : "Shipped or overdue"}</b>;
}
