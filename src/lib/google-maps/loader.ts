"use client";

/// <reference types="google.maps" />

export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Advanced markers need a Map ID; DEMO_MAP_ID works for development only.
export const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const CALLBACK_NAME = "__mghpmGoogleMapsReady";
export const GOOGLE_MAPS_AUTH_FAILURE_EVENT = "mghpm:google-maps-auth-failure";

let loadPromise: Promise<typeof google.maps> | null = null;

/** Loads the Maps JavaScript API once per page, in Spanish, using the dynamic library import. */
export function loadGoogleMaps() {
  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
  }
  if (typeof window !== "undefined" && typeof window.google?.maps?.importLibrary === "function") {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const globalWindow = window as unknown as Record<string, unknown>;
    // Google calls this global when the key is invalid or the referrer is not allowed.
    globalWindow.gm_authFailure = () => {
      window.dispatchEvent(new Event(GOOGLE_MAPS_AUTH_FAILURE_EVENT));
    };
    globalWindow[CALLBACK_NAME] = () => {
      delete globalWindow[CALLBACK_NAME];
      resolve(window.google.maps);
    };

    const params = new URLSearchParams({
      key: googleMapsApiKey,
      v: "weekly",
      language: "es",
      loading: "async",
      callback: CALLBACK_NAME,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      script.remove();
      reject(new Error("No se pudo cargar Google Maps."));
    };
    document.head.append(script);
  });

  return loadPromise;
}
