"use client";

import { useEffect, useRef } from "react";
import { TapAffordance } from "@/components/TapAffordance";
import type { ClipEntry } from "@/lib/clips.types";
import { focalToObjectPosition } from "@/lib/heroIsland";
import { videoBudget } from "@/lib/VideoBudget";

export interface StackFrameProps {
  clip: ClipEntry;
  title: string;
  subtitle: string;
  tag: string;
  pending: boolean;
  pendingLabel: string;
}

/**
 * One selected-work frame (design A, 5A, 6B, 16A). The video starts with
 * preload="none", no src, no poster attribute; the poster is a lazy <img>
 * overlay. The VideoBudget assigns src within one viewport and plays only the
 * clip closest to the viewport center. The frame is focusable; tap or Space
 * toggles a user pause with no visible chrome beyond the affordance.
 */
export function StackFrame({ clip, title, subtitle, tag, pending, pendingLabel }: StackFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    return videoBudget().register({
      el,
      kind: "stack",
      src720: clip.files.mp4_720,
      src1080: clip.files.mp4_1080,
      loop: clip.loop !== "none",
    });
  }, [clip]);

  const toggle = () => {
    if (videoRef.current) videoBudget().toggle(videoRef.current);
  };

  return (
    <figure
      className="frame"
      tabIndex={0}
      role="button"
      aria-label={`Play or pause: ${title}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="frame-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="frame-poster" src={clip.files.poster} alt="" loading="lazy" decoding="async" width={720} height={clip.ratio === "16:9" ? 405 : 1280} />
        <video
          ref={videoRef}
          className="frame-video"
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          data-state="detached"
          data-clip={clip.id}
          style={{ objectPosition: focalToObjectPosition(clip.focal) }}
        />
        <div className="frame-scrim" aria-hidden="true" />
        {pending ? <span className="pending-tag">{pendingLabel}</span> : null}
        <span className="chip frame-chip">{tag}</span>
        <figcaption className="frame-caption">
          <h3 className="frame-title">{title}</h3>
          <p className="tracked frame-subtitle">{subtitle}</p>
        </figcaption>
        <TapAffordance />
      </div>
    </figure>
  );
}
