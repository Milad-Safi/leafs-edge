"use client";

// Generic collapsible section wrapper

import React, { useId, useMemo, useState } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  subtitleRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

// Reusable collapsible section with accessible toggle behavior
export default function CollapsibleSection({
  title,
  defaultOpen = true,
  subtitleRight,
  children,
  className,
}: Props) {
  const reactId = useId();
  const contentId = useMemo(() => `collapsible-${reactId}`, [reactId]);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={[
        "Section",
        open ? "SectionOpen" : "SectionClosed",
        className ?? "",
      ].join(" ")}
    >
      <button
        type="button"
        className="SectionHeader"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="SectionHeaderLeft">
          <div className="SectionTitle">{title}</div>
        </div>

        <div className="SectionHeaderRight">
          {subtitleRight ? (
            <div className="SectionSubRight">{subtitleRight}</div>
          ) : null}

          <span className={["Chevron", open ? "isOpen" : ""].join(" ")}>
            ▼
          </span>
        </div>
      </button>

      <div
        id={contentId}
        className={[
          "SectionBody",
          open ? "SectionBodyShown" : "SectionBodyHidden",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
