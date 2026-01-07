"use client";

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

function normalizeStatus(s: string | null): { code: string; label: string } {
  if (!s) return { code: "UNK", label: "Unknown" };
  const t = s.trim().toUpperCase();

  if (t === "IR" || t.includes("INJURED")) return { code: "IR", label: "IR" };
  if (t === "OUT") return { code: "OUT", label: "OUT" };
  if (t.includes("DAY")) return { code: "DTD", label: "DTD" };
  if (t.includes("QUESTION")) return { code: "GTD", label: "GTD" };

  return { code: t.slice(0, 4), label: t };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[parts.length - 1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function StatusPill({ status }: { status: string | null }) {
  const st = normalizeStatus(status);

  return (
    <span className="leInjPill" title={st.label}>
      {st.code}
    </span>
  );
}

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
    <div className="leInjRow">
      <div className="leInjHeadshot">
        {headshotUrl ? (
          <img
            src={headshotUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
            onError={(e) => {
              // if image fails, hide it (fallback to initials)
              (e.currentTarget as HTMLImageElement).src = "";
            }}
          />
        ) : (
          <div className="leInjInitials">{initials(name)}</div>
        )}
      </div>

      <div className="leInjRowRight">
        <div className="leInjText">
          <div className="leInjName">{name}</div>

          {subtitle ? (
            <div className="leInjSub" title={subtitle}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="leInjPillWrap">
          <StatusPill status={status} />
        </div>
      </div>
    </div>
  );
}

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
    <div className="leInjCol">
      <div className="leInjHeader">
        <div className="leInjTitle">{title}</div>
        {lastUpdated ? (
          <div className="leInjUpdated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        ) : null}
      </div>

      <div className="leInjList">
        {loading ? (
          <div className="leInjEmpty">Loading injuries…</div>
        ) : items.length === 0 ? (
          <div className="leInjEmpty">No reported injuries.</div>
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

  const leftItems = useMemo(() => left?.injuries ?? [], [left]);
  const rightItems = useMemo(() => right?.injuries ?? [], [right]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!leftTeam || !rightTeam) return;
      setLoading(true);

      try {
        const [a, b] = await Promise.all([
          fetch(`/api/team/injuries?team=${encodeURIComponent(leftTeam)}`).then((r) =>
            r.json()
          ),
          fetch(`/api/team/injuries?team=${encodeURIComponent(rightTeam)}`).then((r) =>
            r.json()
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
