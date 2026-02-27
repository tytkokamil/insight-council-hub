import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export function useCountUp({ end, duration = 1.2, decimals = 0, suffix = "", prefix = "" }: UseCountUpOptions) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const ref = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      // Update immediately if value changes after first animation
      setDisplay(`${prefix}${decimals > 0 ? end.toFixed(decimals) : Math.round(end)}${suffix}`);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const durationMs = duration * 1000;

          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * end;
            setDisplay(`${prefix}${decimals > 0 ? current.toFixed(decimals) : Math.round(current)}${suffix}`);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals, suffix, prefix]);

  return { display, ref };
}
