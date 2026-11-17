"use client";

import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { parsePlaceAddress, type ParsedPlaceAddress } from "@/lib/google-maps/address";
import {
  GOOGLE_MAPS_AUTH_FAILURE_EVENT,
  googleMapsApiKey,
  googleMapsMapId,
  loadGoogleMaps,
} from "@/lib/google-maps/loader";
import type { PropertyCountry, PropertyLocation } from "@/lib/properties/schema";
import styles from "./property-form.module.css";

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
};

type PickerStatus = "loading" | "ready" | "unavailable";

type PropertyLocationPickerProps = {
  country: PropertyCountry | "";
  location: PropertyLocation | null;
  onPlaceSelected: (address: ParsedPlaceAddress, location: PropertyLocation) => void;
  onLocationChange: (location: PropertyLocation | null) => void;
};

const countryViewport: Record<PropertyCountry, { center: google.maps.LatLngLiteral; zoom: number }> = {
  DO: { center: { lat: 18.7357, lng: -70.1627 }, zoom: 7 },
  US: { center: { lat: 39.8283, lng: -98.5795 }, zoom: 4 },
};

function roundCoordinate(value: number) {
  return Math.round(value * 1e7) / 1e7;
}

export function PropertyLocationPicker({
  country,
  location,
  onPlaceSelected,
  onLocationChange,
}: PropertyLocationPickerProps) {
  const listboxId = useId();
  const [status, setStatus] = useState<PickerStatus>(googleMapsApiKey ? "loading" : "unavailable");
  const [unavailableReason, setUnavailableReason] = useState(
    googleMapsApiKey ? "" : "La búsqueda con Google no está configurada (falta la API key).",
  );
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const placesRef = useRef<google.maps.PlacesLibrary | null>(null);
  const locationRef = useRef(location);
  const onLocationChangeRef = useRef(onLocationChange);
  const initialViewportRef = useRef({ country, location });

  useEffect(() => {
    locationRef.current = location;
    onLocationChangeRef.current = onLocationChange;
  });

  // Load the API and build the map once.
  useEffect(() => {
    if (!googleMapsApiKey) return;
    let cancelled = false;

    function markUnavailable(reason: string) {
      if (cancelled) return;
      setStatus("unavailable");
      setUnavailableReason(reason);
    }
    function handleAuthFailure() {
      markUnavailable("Google rechazó la API key. Revisa sus restricciones y APIs habilitadas.");
    }
    window.addEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure);

    (async () => {
      try {
        const maps = await loadGoogleMaps();
        const [{ Map }, { AdvancedMarkerElement }, places] = await Promise.all([
          maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>,
        ]);
        if (cancelled || !mapElementRef.current) return;
        placesRef.current = places;

        const initial = initialViewportRef.current;
        const viewport = countryViewport[initial.country || "DO"];
        const map = new Map(mapElementRef.current, {
          center: initial.location
            ? { lat: initial.location.lat, lng: initial.location.lng }
            : viewport.center,
          zoom: initial.location ? 17 : viewport.zoom,
          mapId: googleMapsMapId,
          clickableIcons: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        const marker = new AdvancedMarkerElement({
          gmpDraggable: true,
          title: "Ubicación de la propiedad",
        });

        function placePin(latLng: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined) {
          if (!latLng) return;
          const lat = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
          const lng = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;
          onLocationChangeRef.current({
            lat: roundCoordinate(lat),
            lng: roundCoordinate(lng),
            placeId: locationRef.current?.placeId ?? "",
            source: "pin",
          });
        }

        marker.addListener("dragend", () => placePin(marker.position));
        map.addListener("click", (event: google.maps.MapMouseEvent) => placePin(event.latLng));

        mapRef.current = map;
        markerRef.current = marker;
        setStatus("ready");
      } catch (cause) {
        markUnavailable(cause instanceof Error ? cause.message : "No se pudo cargar Google Maps.");
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(GOOGLE_MAPS_AUTH_FAILURE_EVENT, handleAuthFailure);
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // Keep the pin in sync with the form value.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (status !== "ready" || !map || !marker) return;
    if (location) {
      marker.position = { lat: location.lat, lng: location.lng };
      marker.map = map;
    } else {
      marker.map = null;
    }
  }, [location, status]);

  // When there is no pin yet, follow the selected country.
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || locationRef.current || !country) return;
    map.setCenter(countryViewport[country].center);
    map.setZoom(countryViewport[country].zoom);
  }, [country, status]);

  // Debounced autocomplete requests.
  useEffect(() => {
    const places = placesRef.current;
    const input = query.trim();
    if (status !== "ready" || !places || input.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        sessionTokenRef.current ??= new places.AutocompleteSessionToken();
        const { suggestions: results } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: country ? [country.toLowerCase()] : ["do", "us"],
            language: "es",
          });
        if (cancelled) return;
        setSuggestions(
          results.flatMap((result) => {
            const prediction = result.placePrediction;
            if (!prediction) return [];
            return [
              {
                placeId: prediction.placeId,
                mainText: prediction.mainText?.text ?? prediction.text.text,
                secondaryText: prediction.secondaryText?.text ?? "",
                prediction,
              },
            ];
          }),
        );
        setActiveIndex(-1);
      } catch {
        if (!cancelled) setSearchError("No se pudieron obtener sugerencias de Google.");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, country, status]);

  async function selectSuggestion(suggestion: Suggestion) {
    setSuggestions([]);
    setSelecting(true);
    setSearchError(null);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "location", "formattedAddress"] });
      // The session ends with fetchFields; the next search starts a new one.
      sessionTokenRef.current = null;
      if (!place.location) throw new Error("missing location");

      const parsed = parsePlaceAddress(
        (place.addressComponents ?? []).map((component) => ({
          longText: component.longText,
          shortText: component.shortText,
          types: component.types,
        })),
        suggestion.mainText,
      );
      const nextLocation: PropertyLocation = {
        lat: roundCoordinate(place.location.lat()),
        lng: roundCoordinate(place.location.lng()),
        placeId: suggestion.placeId,
        source: "places",
      };
      onPlaceSelected(parsed, nextLocation);
      setQuery(place.formattedAddress ?? suggestion.mainText);
      mapRef.current?.panTo({ lat: nextLocation.lat, lng: nextLocation.lng });
      mapRef.current?.setZoom(17);
      if (!parsed.country) {
        setSearchError("La dirección está fuera de los países admitidos (República Dominicana y Estados Unidos).");
      }
    } catch {
      setSearchError("No se pudo obtener el detalle de esa dirección. Intenta con otra.");
    } finally {
      setSelecting(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter in the search box must never submit the wizard step.
    if (event.key === "Enter") event.preventDefault();
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setSuggestions([]);
    }
  }

  const listOpen = suggestions.length > 0;

  return (
    <div className={styles.locationPicker}>
      {status !== "unavailable" ? (
        <div className={styles.placeSearch}>
          <label className={styles.field}>
            <span>Buscar dirección en Google</span>
            <div className={styles.searchInputWrap}>
              <Search aria-hidden="true" className={styles.searchIcon} size={16} />
              <input
                aria-activedescendant={
                  activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
                }
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded={listOpen}
                autoComplete="off"
                disabled={status !== "ready" || selecting}
                onBlur={() => window.setTimeout(() => setSuggestions([]), 150)}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status === "loading" ? "Cargando Google Maps…" : "Escribe calle, edificio o sector"
                }
                role="combobox"
                type="search"
                value={query}
              />
              {(searching || selecting) && (
                <Loader2 aria-hidden="true" className={styles.searchSpinner} size={16} />
              )}
            </div>
          </label>
          {listOpen && (
            <ul className={styles.suggestions} id={listboxId} role="listbox">
              {suggestions.map((suggestion, index) => (
                <li
                  aria-selected={index === activeIndex}
                  className={styles.suggestion}
                  id={`${listboxId}-${index}`}
                  key={suggestion.placeId}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    void selectSuggestion(suggestion);
                  }}
                  role="option"
                >
                  <MapPin aria-hidden="true" size={15} />
                  <span>
                    <strong>{suggestion.mainText}</strong>
                    {suggestion.secondaryText && <small>{suggestion.secondaryText}</small>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {searchError && <p className={styles.fieldError}>{searchError}</p>}
        </div>
      ) : (
        <p className={styles.mapNotice}>
          {unavailableReason} Puedes escribir la dirección manualmente; las coordenadas
          quedarán vacías.
        </p>
      )}

      <div className={styles.mapFrame} hidden={status === "unavailable"}>
        <div aria-label="Mapa de ubicación" className={styles.map} ref={mapElementRef} role="region" />
        {status === "loading" && <div className={styles.mapLoading}>Cargando mapa…</div>}
      </div>

      <div className={styles.coordinates}>
        <LocateFixed aria-hidden="true" size={16} />
        <span>
          {location ? (
            <>
              Latitud <strong>{location.lat.toFixed(6)}</strong> · Longitud{" "}
              <strong>{location.lng.toFixed(6)}</strong>
              <small>
                {location.source === "places" ? "Desde Google Places" : "Ajustada en el mapa"}
              </small>
            </>
          ) : status === "ready" ? (
            "Sin coordenadas. Busca la dirección o haz clic en el mapa para colocar el pin."
          ) : (
            "Sin coordenadas."
          )}
        </span>
        {location && (
          <button
            className={styles.linkButton}
            onClick={() => onLocationChange(null)}
            type="button"
          >
            <X aria-hidden="true" size={14} />
            Quitar ubicación
          </button>
        )}
      </div>
    </div>
  );
}
