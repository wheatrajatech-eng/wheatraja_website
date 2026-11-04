"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export const premiumHeroImages = [
  "/assets/banners/wheat-chakki-hero.png",
  "/assets/banners/wheat-field-dawn.png",
  "/assets/banners/dough-kitchen.png",
  "/assets/banners/flour-chakki-still-life.png"
];

export function PremiumHeroCarousel({
  images = premiumHeroImages,
  alt = "Wheat Raja premium grain story"
}: {
  images?: string[];
  alt?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % images.length), 6500);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-label="Wheat Raja visual story">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={index === active ? alt : ""}
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover object-center transition-all duration-[1600ms] ease-out ${index === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
        />
      ))}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-2 backdrop-blur-md">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={`Show hero image ${index + 1}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all ${active === index ? "w-7 bg-[#a9600f]" : "w-1.5 bg-[#68412a]/45"}`}
          />
        ))}
      </div>
    </div>
  );
}
