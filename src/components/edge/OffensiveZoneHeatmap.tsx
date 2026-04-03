import React, { useMemo } from "react";
import type { EdgeAreaRow } from "@/hooks/useTeamEdge";

// OffensiveZoneHeatmap
// Renders an offensive-zone SVG heatmap with per-area values for shots or goals
// Values are pulled from EDGE area rows and placed into fixed labeled zones

type Mode = "shots" | "goals";

// Coerce values into a safe whole number for display
function safeNum(n: unknown) {
  const x = typeof n === "number" ? n : Number(n);
  // Round to the nearest whole number
  return Number.isFinite(x) ? Math.round(x) : 0;
}

// Select the correct numeric metric based on the selected mode
function valueFor(row: EdgeAreaRow | undefined, mode: Mode) {
  if (!row) return 0;
  return mode === "shots" ? safeNum(row.sog) : safeNum(row.goals);
}

export default function OffensiveZoneHeatmap({
  areas,
  mode,
  height = 500,
}: {
  areas: EdgeAreaRow[];
  mode: Mode;
  height?: number;
}) {
  // Build a quick lookup so SVG labels can pull values by area name
  const byArea = useMemo(() => {
    const m = new Map<string, EdgeAreaRow>();
    for (const r of areas ?? []) m.set(r.area, r);
    return m;
  }, [areas]);

  // Map NHL EDGE area names into a stable object used by the SVG text nodes
  const vals = useMemo(() => {
    const get = (name: string) => valueFor(byArea.get(name), mode);

    return {
      "L Corner": get("L Corner"),
      "Behind the Net": get("Behind the Net"),
      "R Corner": get("R Corner"),
      "Outside L": get("Outside L"),
      "L Net Side": get("L Net Side"),
      "Low Slot": get("Low Slot"),
      Crease: get("Crease"),
      "R Net Side": get("R Net Side"),
      "Outside R": get("Outside R"),
      "L Circle": get("L Circle"),
      "High Slot": get("High Slot"),
      "R Circle": get("R Circle"),
      "L Point": get("L Point"),
      "Center Point": get("Center Point"),
      "R Point": get("R Point"),
      "Offensive Neutral Zone": get("Offensive Neutral Zone"),
    };
  }, [byArea, mode]);

  // Compute the highest-value area for the footer summary
  const { maxArea, maxValue, unitLabel } = useMemo(() => {
    const unit = mode === "shots" ? "SOG" : "goals";
    let bestArea = "";
    let best = -1;

    for (const [k, v] of Object.entries(vals)) {
      if (v > best) {
        best = v;
        bestArea = k;
      }
    }
    return { maxArea: bestArea, maxValue: Math.max(0, best), unitLabel: unit };
  }, [vals, mode]);

  // Centralized color palette for the SVG
  const COLORS = {
    BLACK: "rgba(0, 0, 0, 1)",
    STROKE: "#1a1d24", 
  };

  // Reusable inline styles for the text labels
  const labelStyle: React.CSSProperties = {
    fontWeight: 400,
    fontSize: "10px",
    fill: "#111",
    textAnchor: "middle",
    filter: "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
  };

  const largeLabelStyle: React.CSSProperties = {
    fontWeight: 400,
    fontSize: "11px",
    fill: "#000",
    textAnchor: "middle",
    filter: "drop-shadow(0px 0px 2px rgba(255,255,255,0.8))",
  };

  const creaseLabelStyle: React.CSSProperties = {
    ...labelStyle,
    fontSize: "8px",
  };

  return (
    // Wrapper holds the SVG plus the small summary footer
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 204 214"
        width="100%"
        height={height}
        style={{
          display: "block",
          borderRadius: 16,
          background: COLORS.BLACK,
          border: `2px solid #333`,
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          letterSpacing: "0.1px",
        }}
      >
        <defs>
          <clipPath id="ice-clip">
            <path d="M 2 77 C 2 30, 30 2, 66 2 L 138 2 C 174 2, 202 30, 202 77 L 202 214 L 2 214 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#ice-clip)">
          {/* WHITE ICE BACKGROUND */}
          <rect x="0" y="0" width="204" height="214" fill="#ffffff" />
          
          {/* GOAL LINE */}
          <line x1="0" y1="34" x2="204" y2="34" stroke="rgba(204,0,0,0.4)" strokeWidth="1.5" />
          
          {/* BLUE LINE */}
          <line x1="0" y1="183" x2="204" y2="183" stroke="rgba(0,51,160,0.5)" strokeWidth="2" />
        </g>

        {/* CREASE ZONE */}
        <svg viewBox="0 0 33 18" width="33" height="18" x="85" y="33">
          <path d="M1.89018 0.909912C1.83305 1.26 1.81087 1.61491 1.82396 1.96939V3.02887C2.08446 6.65021 3.71573 10.036 6.38546 12.4966C9.05519 14.9572 12.5626 16.3075 16.1931 16.2723C17.3087 16.2749 18.4206 16.1414 19.5039 15.875C22.4491 15.2211 25.1117 13.6517 27.1101 11.3916C29.1084 9.13151 30.3401 6.29681 30.6284 3.29374C30.6284 2.89643 30.6946 2.56535 30.6946 2.16804V1.96939C30.7036 1.61497 30.6814 1.26045 30.6284 0.909912" 
                fill="rgba(90, 181, 227, 0.7)" 
                stroke={COLORS.STROKE} 
                strokeWidth="1" 
                strokeMiterlimit="10"/>
          {/* Black section line completing the grid over the crease */}
          <line x1="0" y1="1" x2="33" y2="1" stroke={COLORS.STROKE} strokeWidth="1.2" />
        </svg>

        {/* BLACK ZONE BOUNDARIES */}
        <g stroke={COLORS.STROKE} strokeWidth="1" strokeMiterlimit="10" fill="none">
          <path d="M201.243 181.978H2.32703" />
          <path d="M2.06226 77.0239V212.041L201.574 211.71V147.612L201.243 147.214L174.756 111.788C174.663 111.896 174.551 111.986 174.425 112.053L172.637 113.642C169.399 116.471 165.994 119.102 162.44 121.522C161.712 121.985 160.983 122.515 160.321 122.979L158.136 124.369C157.407 124.833 156.679 125.23 155.951 125.694C155.222 126.091 154.494 126.554 153.766 126.952C152.044 127.879 150.322 128.806 148.534 129.667C148.269 129.799 148.071 129.865 147.806 129.998C147.409 130.196 147.011 130.395 146.548 130.594C145.753 130.991 144.959 131.322 144.164 131.653C142.972 132.183 141.846 132.646 140.655 133.11C138.712 133.722 139.674 133.589 139.21 133.722M139.463 134.368V134.434L144.628 150.393L154.825 181.647L154.891 181.846L154.957 181.978V182.045" />
          <path d="M2.06226 148.141L28.4163 112.781C39.233 122.483 51.8876 129.914 65.6299 134.633" />
          <path d="M50.3319 182.045L65.6282 134.633C89.5741 142.84 115.628 142.465 139.328 133.573" />
          <path d="M201.574 73.5144V147.612L174.69 111.788" />
          <path d="M65.6269 134.699C51.8845 129.98 39.2297 122.549 28.4129 112.848L59.2038 71.7267C71.3582 80.9416 86.1977 85.9192 101.45 85.8972C116.977 85.8948 132.066 80.7487 144.359 71.2632L174.753 111.854C164.445 121.315 151.805 128.293 138.711 133.223M65.6269 134.699L82.1811 83.381M65.6269 134.699C89.5726 142.906 115.012 142.115 138.711 133.223M138.711 133.223L123.103 83.3147" />
          <path d="M63.3829 33.9166H33.7177C33.7839 34.1814 33.8501 34.5125 33.9163 34.7774C37.7986 48.4321 45.7152 60.5955 56.6288 69.6739L58.4166 71.0645C58.6815 71.2631 58.8802 71.3955 59.145 71.5942L87.4198 33.8503H63.3829" />
          <path d="M140.323 33.9165H116.352L144.296 71.1968L145.091 70.6009C145.687 70.1374 146.283 69.6738 146.879 69.1441C157.498 60.1377 165.197 48.1742 168.995 34.7773C169.061 34.5125 169.127 34.1814 169.194 33.9165H140.323Z" />
          <path d="M174.695 111.788L144.302 71.1968L145.096 70.6009C145.692 70.1374 146.288 69.6738 146.884 69.1441C157.504 60.1377 165.203 48.1742 169.001 34.7773C169.067 34.5125 169.133 34.1814 169.199 33.9165H192.177C192.375 34.1814 192.508 34.5125 192.706 34.7773C198.528 44.7915 201.59 56.1703 201.579 67.7535V73.5144" />
          <path d="M11.3983 33.9164H63.3788V2.13208C51.9534 2.90187 40.9278 6.64555 31.3959 12.9917C25.7999 16.7484 20.7999 21.3243 16.5633 26.5663C15.9673 27.2947 15.3713 28.0893 14.8416 28.8176C13.9808 30.0096 13.12 31.2677 12.3254 32.5258L11.3983 33.9164Z" />
          <path d="M140.329 33.9166H192.177C191.912 33.4531 191.581 32.9896 191.316 32.5261C190.522 31.2679 189.661 30.0098 188.8 28.8179C188.204 28.0233 187.674 27.2949 187.012 26.5665C182.618 21.101 177.389 16.3633 171.517 12.5284C162.188 6.43841 151.446 2.85769 140.329 2.13232V33.9166Z" />
          <path d="M140.327 2.13219C139.467 2.06597 138.539 1.99976 137.679 1.99976H65.9642C65.1034 1.99976 64.2426 2.06597 63.3817 2.13219V33.9827H87.4852" />
          <path d="M2.06228 77.024V67.7535C2.05214 56.1703 5.1139 44.7915 10.9354 34.7773L11.4651 33.9165H33.7803C33.8465 34.1814 33.9127 34.5125 33.9789 34.7773C37.8613 48.4320 45.7779 60.5955 56.6914 69.6738L58.4793 71.0644C58.7441 71.2631 58.9428 71.3955 59.2077 71.5941L28.4167 112.715" />
        </g>

        {/* DYNAMIC DATA LABELS */}
        <text x="45" y="25" style={labelStyle}>{vals["L Corner"]}</text>
        <text x="102" y="22" style={largeLabelStyle}>{vals["Behind the Net"]}</text>
        <text x="160" y="25" style={labelStyle}>{vals["R Corner"]}</text>
        
        <text x="25" y="75" style={largeLabelStyle}>{vals["Outside L"]}</text>
        <text x="180" y="75" style={labelStyle}>{vals["Outside R"]}</text>
        
        <text x="58" y="52" style={labelStyle}>{vals["L Net Side"]}</text>
        <text x="145" y="52" style={labelStyle}>{vals["R Net Side"]}</text>
        
        <text x="102" y="44" style={creaseLabelStyle}>{vals["Crease"]}</text>
        <text x="102" y="69" style={largeLabelStyle}>{vals["Low Slot"]}</text>
        <text x="102" y="116" style={largeLabelStyle}>{vals["High Slot"]}</text>
        
        {/* Circle text labels shifted +5px to perfectly center in the new circle positions */}
        <text x="57" y="117" style={largeLabelStyle}>{vals["L Circle"]}</text>
        <text x="145" y="117" style={largeLabelStyle}>{vals["R Circle"]}</text>
        
        <text x="30" y="155" style={largeLabelStyle}>{vals["L Point"]}</text>
        <text x="102" y="165" style={largeLabelStyle}>{vals["Center Point"]}</text>
        <text x="170" y="155" style={largeLabelStyle}>{vals["R Point"]}</text>
        
        <text x="102" y="201" style={largeLabelStyle}>{vals["Offensive Neutral Zone"]}</text>

        {/* OVERALL RINK BOUNDARY */}
        <path d="M 2 77 C 2 30, 30 2, 66 2 L 138 2 C 174 2, 202 30, 202 77 L 202 214 L 2 214 Z" fill="none" stroke="#333" strokeWidth="1.5" />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          opacity: 1,
          fontSize: 11,
          color: "#fff",
        }}
      >
        <span>
          Highest Zone: {maxValue} {unitLabel} {maxArea ? `(${maxArea})` : ""}
        </span>
      </div>
    </div>
  );
}