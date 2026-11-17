import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import p1 from "@/assets/Foto_ccasa_7.jpg.asset.json";
import p2 from "@/assets/Foto_casa_4.jpg.asset.json";
import p3 from "@/assets/Foto_Casa_5.jpg.asset.json";
import pool from "@/assets/villa-pool.png.asset.json";

const slides = [p1, p2, p3, pool].map((p) => p.url);

export function PhotoCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [i]);
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length);

  return (
    <>
        <div className="absolute inset-0">
          {slides.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt={`Managed property photo ${idx + 1}`}
              loading={idx === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${idx === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
          <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4" role="group" aria-label="Property photos">
            <Button onClick={() => go(-1)} aria-label="Previous photo" variant="outline" size="icon" className="rounded-full border-primary-foreground/40 bg-navy/40 text-primary-foreground hover:bg-navy/70 hover:text-primary-foreground"><ChevronLeft /></Button>
            {slides.map((_, idx) => (
              <Button key={idx} onClick={() => setI(idx)} aria-label={`Show photo ${idx + 1}`} aria-pressed={idx === i} variant="ghost" size="icon" className="h-9 w-6 rounded-full p-0 hover:bg-primary-foreground/10">
                <span className={`h-1.5 w-5 rounded-full ${idx === i ? "bg-gold" : "bg-card/70"}`} />
              </Button>
            ))}
            <Button onClick={() => go(1)} aria-label="Next photo" variant="outline" size="icon" className="rounded-full border-primary-foreground/40 bg-navy/40 text-primary-foreground hover:bg-navy/70 hover:text-primary-foreground"><ChevronRight /></Button>
          </div>
    </>
  );
}
