"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

/** Normalize anything we get from query params or data into a usable src */
function normalizeSrc(src) {
  if (!src || typeof src !== "string") return "/placeholder.png";

  // Try to decode if it was percent-encoded
  try { src = decodeURIComponent(src); } catch {}

  const s = src.trim().replace(/^['"]|['"]$/g, ""); // strip stray quotes

  // Allow data URLs
  if (/^data:image\/[a-zA-Z]+;base64,/.test(s)) return s;

  // Absolute http(s)
  if (/^https?:\/\//i.test(s)) return s;

  // Root-relative path
  if (s.startsWith("/")) return s;

  // Fallback: make it root-relative
  return "/" + s.replace(/^\.?\/+/, "");
}

export default function SafeImage({ src, alt = "", ...props }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = useMemo(() => normalizeSrc(src), [src]);

  if (failed) {
    // hard fallback to a local placeholder
    return <img src="/placeholder.png" alt={alt || "image placeholder"} {...props} />;
  }

  // Use unoptimized for remote/data URLs to avoid Next’s URL parsing/loader issues
  const isRemoteOrData = /^https?:\/\//i.test(safeSrc) || /^data:image\//i.test(safeSrc);

  return (
    <Image
      src={safeSrc}
      alt={alt}
      // Forward only the usual layout props explicitly so next/image is happy
      width={props.width}
      height={props.height}
      fill={props.fill}
      sizes={props.sizes}
      className={props.className}
      priority={props.priority}
      unoptimized={isRemoteOrData}
      onError={() => setFailed(true)}
    />
  );
}
