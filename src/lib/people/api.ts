import "server-only";

import { NextResponse } from "next/server";
import {
  ArchivedPersonUpdateError,
  PersonAccountEmailLockedError,
  PersonActiveAccountArchiveError,
  PersonEmailConflictError,
  PersonLinkInvalidError,
  PersonOpenLeaseArchiveError,
  PersonRecordNotFoundError,
  PersonActiveLeaseError,
  PersonRepresentativeInvalidError,
  PersonRepresentsEntitiesError,
} from "./records";

export function getPersonErrorResponse(error: unknown, logMessage: string) {
  if (error instanceof PersonRecordNotFoundError) {
    return NextResponse.json({ error: "No se encontró la persona." }, { status: 404 });
  }
  if (error instanceof PersonEmailConflictError) {
    return NextResponse.json(
      { error: "Ya existe un registro activo del mismo tipo (persona o entidad) con ese correo electrónico." },
      { status: 409 },
    );
  }
  if (error instanceof PersonActiveLeaseError) {
    return NextResponse.json({ error: "Tiene un contrato activo" }, { status: 409 });
  }
  if (error instanceof PersonRepresentativeInvalidError) {
    return NextResponse.json(
      { error: "El representante debe ser una persona individual activa de la organización." },
      { status: 400 },
    );
  }
  if (error instanceof PersonRepresentsEntitiesError) {
    return NextResponse.json(
      { error: "Esta persona es representante de una entidad. Asigna otro representante primero." },
      { status: 409 },
    );
  }
  if (error instanceof ArchivedPersonUpdateError) {
    return NextResponse.json(
      { error: "Restaura el registro antes de editarlo." },
      { status: 409 },
    );
  }
  if (error instanceof PersonAccountEmailLockedError) {
    return NextResponse.json(
      { error: "Esta persona tiene una cuenta de acceso; su correo no puede cambiarse aquí." },
      { status: 409 },
    );
  }
  if (error instanceof PersonActiveAccountArchiveError) {
    return NextResponse.json(
      { error: "Suspende primero su acceso en Usuarios y accesos para poder archivarla." },
      { status: 409 },
    );
  }
  if (error instanceof PersonOpenLeaseArchiveError) {
    return NextResponse.json(
      { error: "Este inquilino tiene un contrato pendiente o activo. Ciérralo antes de archivarlo." },
      { status: 409 },
    );
  }
  if (error instanceof PersonLinkInvalidError) {
    return NextResponse.json(
      {
        error:
          error.target === "property"
            ? "La propiedad seleccionada no existe o está archivada."
            : "La unidad seleccionada no existe o está archivada.",
      },
      { status: 400 },
    );
  }

  console.error(logMessage, error);
  return NextResponse.json(
    { error: "No se pudo guardar el registro. Inténtalo más tarde." },
    { status: 500 },
  );
}
