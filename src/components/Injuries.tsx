"use client";

// Injuries comparison UI section.

import React, { useEffect, useMemo, useState } from "react";

type ApiInjury = {
  playerId: number | null;
  player: string;
  pos: string | null;
  status: string | null;
  date: string | null;
  description: string | null;
  headshot: string | null;
};

type ApiPayload = {
  team: string;
  teamName: string | null;
  teamSeo: string | null;
  source: string;
  lastUpdated: string;
  injuries: ApiInjury[];
};

// Normalize raw status strings into short codes + readable labels.
function normalizeStatus(s: string | null): { code: string; label: string } {
  if (!s) return { code: "UNK", label: "Unknown" };
  const t = s.trim().toUpperCase();

  if (t === "IR" || t.includes("INJURED")) return { code: "IR", label: "IR" };
  if (t === "OUT") return { code: "OUT", label: "OUT" };
  if (t.includes("DAY")) return { code: "DTD", label: "DTD" };
  if (t.includes("QUESTION")) return { code: "GTD", label: "GTD" };

  return { code: t.slice(0, 4), label: t };
}

// Generate initials from a player name (used as a fallback avatar).
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[parts.length - 1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

// Small pill UI that displays a normalized injury status code.
function StatusPill({ status }: { status: string | null }) {
  const st = normalizeStatus(status);

  return (
    <span className="InjPill" title={st.label}>
      {st.code}
    </span>
  );
}

// Single injury row showing player info, description, and status.
function InjuryRow({
  name,
  status,
  subtitle,
  headshotUrl,
}: {
  name: string;
  status: string | null;
  subtitle?: string | null;
  headshotUrl?: string | null;
}) {
  return (
    <div className="InjRow">
      <div className="InjHeadshot">
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
            onError={(e) => {
              // If image fails, hide it so initials can be shown instead.
              (e.currentTarget as HTMLImageElement).src = "";
            }}
          />
        ) : (
          <div className="InjInitials">{initials(name)}</div>
        )}
      </div>

      <div className="InjRowRight">
        <div className="InjText">
          <div className="InjName">{name}</div>

          {subtitle ? (
            <div className="InjSub" title={subtitle}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="InjPillWrap">
          <StatusPill status={status} />
        </div>
      </div>
    </div>
  );
}

// Column wrapper for one team’s injury list.
function Column({
  title,
  loading,
  items,
  lastUpdated,
}: {
  title: string;
  loading: boolean;
  items: ApiInjury[];
  lastUpdated?: string | null;
}) {
  return (
    <div className="InjCol">
      <div className="InjHeader">
        <div className="InjTitle">{title}</div>
        {lastUpdated ? (
          <div className="InjUpdated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        ) : null}
      </div>

      <div className="InjList">
        {loading ? (
          <div className="InjEmpty">Loading injuries…</div>
        ) : items.length === 0 ? (
          <div className="InjEmpty">No reported injuries.</div>
        ) : (
          items.slice(0, 6).map((x, idx) => (
            <InjuryRow
              key={`${x.playerId ?? x.player}-${idx}`}
              name={x.player}
              status={x.status}
              subtitle={x.description}
              headshotUrl={x.headshot}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Main injuries section that fetches and displays injuries for both teams.
export default function InjuriesSection({
  leftTeam,
  rightTeam,
}: {
  leftTeam: string | null;
  rightTeam: string | null;
}) {
  const [left, setLeft] = useState<ApiPayload | null>(null);
  const [right, setRight] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize injury arrays to avoid unnecessary re-renders.
  const leftItems = useMemo(() => left?.injuries ?? [], [left]);
  const rightItems = useMemo(() => right?.injuries ?? [], [right]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!leftTeam || !rightTeam) return;
      setLoading(true);

      try {
        const [a, b] = await Promise.all([
          fetch(`/api/team/injuries?team=${encodeURIComponent(leftTeam)}`).then(
            (r) => r.json()
          ),
          fetch(`/api/team/injuries?team=${encodeURIComponent(rightTeam)}`).then(
            (r) => r.json()
          ),
        ]);
        if (cancelled) return;
        setLeft(a);
        setRight(b);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [leftTeam, rightTeam]);

  return (
    <section style={{ width: "100%", marginTop: 34, paddingBottom: 15 }}>
      <div
        className="injuriesGrid"
        style={{
          gap: 28,
          paddingInline: 18,
        }}
      >
        <Column
          title="Injuries:"
          loading={loading}
          items={leftItems}
          lastUpdated={left?.lastUpdated ?? null}
        />
        <Column
          title="Injuries:"
          loading={loading}
          items={rightItems}
          lastUpdated={right?.lastUpdated ?? null}
        />
      </div>
    </section>
  );
}
