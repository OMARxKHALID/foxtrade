"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { CandleBackdrop } from "@/components/ui/candle-backdrop";
import { GradientButton } from "@/components/ui/gradient-button";
import { SectionBadge } from "@/components/ui/section-badge";
import { cn } from "@/lib/utils";

const INTERVAL = 6000;

export const BannerCarousel = ({ banners }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const banner = banners[index % Math.max(banners.length, 1)];

  useEffect(() => {
    if (paused || reduceMotion || banners.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % banners.length), INTERVAL);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, banners.length]);

  const handleSelect = (next) => setIndex(next);
  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  if (!banner) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      className="relative h-[200px] overflow-hidden rounded-2xl border border-white/10 bg-black md:h-[320px]"
    >
      <CandleBackdrop />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-full max-w-[520px] flex-col justify-center px-5 md:px-12"
          aria-live="polite"
        >
          <SectionBadge className="self-start">{banner.eyebrow}</SectionBadge>
          <h2 className="mt-3 font-heading text-xl leading-tight font-bold tracking-tight text-white md:mt-5 md:text-[40px]">
            {banner.title}
          </h2>
          <p className="mt-2 hidden text-sm leading-[22px] text-neutral-300 md:block">{banner.text}</p>
          <GradientButton href={banner.cta.href} size="sm" className="mt-4 self-start sm:mt-6">
            {banner.cta.label}
            <ArrowUpRight className="size-4" />
          </GradientButton>
        </motion.div>
      </AnimatePresence>
      <div className="absolute right-5 bottom-4 flex gap-3 md:right-8 md:bottom-6">
        {banners.map((item, i) => (
          <button
            key={item.id}
            onClick={() => handleSelect(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            className="-mx-1 -my-2 flex h-6 items-center px-2"
          >
            <span className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-brand" : "w-2 bg-white/40")} />
          </button>
        ))}
      </div>
    </section>
  );
};
