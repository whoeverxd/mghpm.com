import { useEffect, useRef } from "react";
import { PhotoCarousel } from "@/components/PhotoCarousel";

export function HeroParallax() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (card.current) card.current.style.transform = `perspective(1200px) rotateY(${cx * 14 - 8}deg) rotateX(${cy * -10 + 4}deg) translateZ(0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy">
      <PhotoCarousel />
      <div className="hero-veil pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-44 pt-36 lg:grid-cols-[1.25fr_1fr]">
        <div className="hero-text-glass animate-rise rounded-3xl p-8 md:p-10">
          <p className="eyebrow !text-gold">Punta Cana · Cabarete · La Romana</p>
          <h1 className="mt-6 text-5xl font-medium leading-[1.02] !text-primary-foreground md:text-7xl xl:text-8xl">
            Your Property.<br />Our Expertise.<br />
            <em className="text-gold-gradient font-semibold">Your Peace of Mind.</em>
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
            Professional property management across the Caribbean — leasing, rent collection, maintenance and
            transparent reporting, in one connected experience.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#contact" className="rounded-full bg-gold px-7 py-4 text-sm font-semibold text-navy shadow-gold transition hover:-translate-y-0.5">
              Request a Management Proposal
            </a>
            <a href="#properties" className="rounded-full border border-primary-foreground/40 px-7 py-4 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition hover:bg-primary-foreground/10">
              View Properties
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.65rem] uppercase tracking-[0.4em] text-primary-foreground/60">Scroll</div>
    </section>
  );
}
