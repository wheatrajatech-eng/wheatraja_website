"use client";

import { useEffect, useRef } from "react";

export function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadVideo = () => {
      const video = videoRef.current;
      if (!video || video.src) return;
      video.src = "/assets/banners/home-hero-loop.mp4";
      video.load();
      void video.play().catch(() => undefined);
    };

    const idleId = window.setTimeout(loadVideo, 1200);

    return () => {
      window.clearTimeout(idleId);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 z-[1] h-full w-full object-cover object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster="/assets/banners/wheat-chakki-hero.webp"
      aria-hidden="true"
    />
  );
}
