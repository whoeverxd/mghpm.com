import "server-only";

import { NextResponse } from "next/server";
import { MAX_PROPERTY_IMAGES } from "./image-schema";
import {
  InvalidPropertyImageError,
  PropertyImageLimitError,
  PropertyImageNotFoundError,
  PropertyImageOrderError,
} from "./images";
import { PropertyRecordNotFoundError } from "./records";

export function getImageErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof PropertyRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la propiedad." }, { status: 404 });
  }
  if (error instanceof PropertyImageNotFoundError) {
    return NextResponse.json({ error: "No se encontró la imagen." }, { status: 404 });
  }
  if (error instanceof InvalidPropertyImageError) {
    return NextResponse.json(
      { error: "El archivo no es una imagen JPG, PNG o WebP válida." },
      { status: 415 },
    );
  }
  if (error instanceof PropertyImageLimitError) {
    return NextResponse.json(
      { error: `La propiedad ya tiene el máximo de ${MAX_PROPERTY_IMAGES} imágenes.` },
      { status: 409 },
    );
  }
  if (error instanceof PropertyImageOrderError) {
    return NextResponse.json(
      { error: "La galería cambió mientras la editabas. Recarga la página e inténtalo de nuevo." },
      { status: 409 },
    );
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo procesar la imagen. Inténtalo más tarde." },
    { status: 500 },
  );
}
