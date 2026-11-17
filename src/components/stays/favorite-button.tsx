"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  parseStayFavorites,
  serializeStayFavorites,
  STAY_FAVORITES_COOKIE,
  stayKey,
  toggleStayFavorite,
} from "@/lib/stays/favorites";
import styles from "./stays.module.css";

function readFavoritesCookie() {
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${STAY_FAVORITES_COOKIE}=`));
  return parseStayFavorites(entry?.slice(STAY_FAVORITES_COOKIE.length + 1));
}

type FavoriteButtonProps = {
  propertyId: string;
  unitId: string;
  initialSaved: boolean;
  saveLabel: string;
  removeLabel: string;
};

/** Saves the stay in a cookie (no account needed) and refreshes the server view. */
export function FavoriteButton({
  propertyId,
  unitId,
  initialSaved,
  saveLabel,
  removeLabel,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  function toggle() {
    const key = stayKey(propertyId, unitId);
    const next = toggleStayFavorite(readFavoritesCookie(), key);
    document.cookie = `${STAY_FAVORITES_COOKIE}=${serializeStayFavorites(next)}; path=/; max-age=31536000; samesite=lax`;
    setSaved(next.includes(key));
    startTransition(() => router.refresh());
  }

  return (
    <button
      aria-label={saved ? removeLabel : saveLabel}
      aria-pressed={saved}
      className={styles.favoriteButton}
      data-saved={saved}
      onClick={toggle}
      title={saved ? removeLabel : saveLabel}
      type="button"
    >
      <Heart aria-hidden="true" fill={saved ? "currentColor" : "none"} size={18} />
    </button>
  );
}
