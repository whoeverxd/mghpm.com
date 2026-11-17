"use client";

import { useState } from "react";
import styles from "./stays.module.css";

type Counter = { key: "adults" | "children" | "pets"; label: string; min: number; max: number };

type GuestCountersProps = {
  initialGuests: number;
  initialPets: number;
  labels: { adults: string; children: string; pets: string };
  decreaseLabel: string;
  increaseLabel: string;
};

const MAX_GUESTS = 30;

/**
 * Adults + children become the "guests" search parameter. The hidden inputs
 * carry the server values, so the plain GET form still works without JavaScript.
 */
export function GuestCounters({
  initialGuests,
  initialPets,
  labels,
  decreaseLabel,
  increaseLabel,
}: GuestCountersProps) {
  const [values, setValues] = useState({ adults: initialGuests, children: 0, pets: initialPets });
  const guests = values.adults + values.children;

  const counters: Counter[] = [
    { key: "adults", label: labels.adults, min: 1, max: MAX_GUESTS - values.children },
    { key: "children", label: labels.children, min: 0, max: MAX_GUESTS - values.adults },
    { key: "pets", label: labels.pets, min: 0, max: 5 },
  ];

  function change(counter: Counter, delta: number) {
    setValues((current) => ({
      ...current,
      [counter.key]: Math.min(counter.max, Math.max(counter.min, current[counter.key] + delta)),
    }));
  }

  return (
    <div className={styles.counters}>
      <input name="guests" type="hidden" value={guests} />
      <input name="pets" type="hidden" value={values.pets} />
      {counters.map((counter) => (
        <div className={styles.counter} key={counter.key}>
          <span className={styles.searchLabel}>{counter.label}</span>
          <div className={styles.counterControls}>
            <button
              aria-label={decreaseLabel.replace("{label}", counter.label)}
              disabled={values[counter.key] <= counter.min}
              onClick={() => change(counter, -1)}
              type="button"
            >
              −
            </button>
            <output aria-live="polite">{values[counter.key]}</output>
            <button
              aria-label={increaseLabel.replace("{label}", counter.label)}
              disabled={values[counter.key] >= counter.max}
              onClick={() => change(counter, 1)}
              type="button"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
