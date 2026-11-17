import "server-only";

import { NextResponse } from "next/server";
import { PersonRecordNotFoundError } from "@/lib/people/records";
import { PropertyRecordNotFoundError } from "@/lib/properties/records";
import {
  OwnershipConflictError,
  OwnershipEndedError,
  OwnershipNotFoundError,
  OwnershipPropertyArchivedError,
  OwnershipReviewForbiddenError,
  OwnershipTransitionError,
} from "./records";

export function getOwnershipErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof OwnershipConflictError) {
    return NextResponse.json(
      {
        error:
          error.reason === "duplicate"
            ? "Ya existe una titularidad activa de esta persona en la propiedad."
            : `Solo queda ${error.available} % disponible.`,
      },
      { status: 409 },
    );
  }
  if (error instanceof OwnershipTransitionError) {
    return NextResponse.json(
      { error: "Ese cambio de estado no está permitido desde el estado actual." },
      { status: 409 },
    );
  }
  if (error instanceof OwnershipPropertyArchivedError) {
    return NextResponse.json(
      { error: "No se pueden agregar propietarios a una propiedad archivada." },
      { status: 409 },
    );
  }
  if (error instanceof OwnershipEndedError) {
    return NextResponse.json({ error: "La titularidad ya está finalizada." }, { status: 409 });
  }
  if (error instanceof OwnershipReviewForbiddenError) {
    return NextResponse.json(
      {
        error:
          error.reason === "own_record"
            ? "No puedes revisar una titularidad que creaste tú."
            : "Tu rol no tiene permiso para revisar titularidades.",
      },
      { status: 403 },
    );
  }
  if (error instanceof OwnershipNotFoundError) {
    return NextResponse.json({ error: "No se encontró la titularidad." }, { status: 404 });
  }
  if (error instanceof PersonRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la persona." }, { status: 404 });
  }
  if (error instanceof PropertyRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la propiedad." }, { status: 404 });
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo guardar la titularidad. Inténtalo más tarde." },
    { status: 500 },
  );
}
