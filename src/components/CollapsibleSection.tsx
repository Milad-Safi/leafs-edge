"use client";

import React, { useId, useMemo, useState } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  subtitleRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

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
        "leSection",
        open ? "leSectionOpen" : "leSectionClosed",
        className ?? "",
      ].join(" ")}
    >
      <button
        type="button"
        className="leSectionHeader"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="leSectionHeaderLeft">
          <div className="leSectionTitle">{title}</div>
        </div>

        <div className="leSectionHeaderRight">
          {subtitleRight ? (
            <div className="leSectionSubRight">{subtitleRight}</div>
          ) : null}

          <span className={["leChevron", open ? "isOpen" : ""].join(" ")}>
            ▼
          </span>
        </div>
      </button>

      <div
        id={contentId}
        className={[
          "leSectionBody",
          open ? "leSectionBodyShown" : "leSectionBodyHidden",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
