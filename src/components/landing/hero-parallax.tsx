"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { landingPhotos } from "@/data/landing-page";
import styles from "./landing-page.module.css";

export function HeroParallax() {
  const [activePhoto, setActivePhoto] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % landingPhotos.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (card.current) {
        card.current.style.transform = `perspective(1200px) rotateY(${currentX * 8}deg) rotateX(${currentY * -5}deg)`;
      }
      frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const showPhoto = (offset: number) => {
    setActivePhoto(
      (current) =>
        (current + offset + landingPhotos.length) % landingPhotos.length,
    );
  };

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroPhotos} aria-hidden="true">
        {landingPhotos.map((photo, index) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={`${styles.heroPhoto} ${
              index === activePhoto ? styles.heroPhotoActive : ""
            }`}
          />
        ))}
      </div>
      <div className={styles.heroVeil} />

      <div className={styles.heroContent}>
        <div ref={card} className={styles.heroText}>
          <p className={styles.eyebrowLight}>
            Punta Cana · Cabarete · La Romana
          </p>
          <h1 id="hero-title">
            Your Property.
            <br />
            Our Expertise.
            <br />
            <em>Your Peace of Mind.</em>
          </h1>
          <p className={styles.heroDescription}>
            Professional property management across the Caribbean — leasing,
            rent collection, maintenance and transparent reporting, in one
            connected experience.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.goldButton} href="#contact">
              Request a Management Proposal
            </a>
            <a className={styles.outlineButton} href="#services">
              Explore Services
            </a>
          </div>
        </div>
      </div>

      <div className={styles.carouselControls} role="group" aria-label="Property photos">
        <button
          className={styles.carouselArrow}
          type="button"
          onClick={() => showPhoto(-1)}
          aria-label="Previous photo"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        {landingPhotos.map((photo, index) => (
          <button
            key={photo.src}
            className={styles.carouselDot}
            type="button"
            onClick={() => setActivePhoto(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-pressed={index === activePhoto}
          >
            <span
              className={
                index === activePhoto ? styles.carouselDotActive : undefined
              }
            />
          </button>
        ))}
        <button
          className={styles.carouselArrow}
          type="button"
          onClick={() => showPhoto(1)}
          aria-label="Next photo"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <span className={styles.scrollLabel} aria-hidden="true">
        Scroll
      </span>
    </section>
  );
}
