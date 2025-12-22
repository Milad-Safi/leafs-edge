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
    <span
      title={st.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 9999,
        background: "rgba(239, 68, 68, 1)",
        color: "white",
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        flex: "0 0 auto",
      }}
    >
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: 16,
        alignItems: "center",
      }}
    >
      {/* Image box */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshotUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
            onError={(e) => {
              // if NHL image 404s, fallback to initials box
              (e.currentTarget as HTMLImageElement).src = "";
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 22,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 16,
              lineHeight: 1.15,
              color: "rgba(255,255,255,0.92)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 360,
            }}
          >
            {name}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.60)",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 440,
              }}
              title={subtitle}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ marginLeft: "auto" }}>
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
    <div
      style={{
        padding: 22,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.28)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.92)" }}>
          {title}
        </div>
        {lastUpdated ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading injuries…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.65)" }}>No reported injuries.</div>
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
      if (!leftTeam || !rightTeam) return; // ✅ don't fetch with null
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
    <section style={{ width: "100%", marginTop: 34 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
